import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from token
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { paymentId } = await req.json();

    console.log('Checking payment status:', { paymentId });

    // Get payment record
    const { data: payment, error: paymentError } = await supabaseServiceClient
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('user_id', user.id)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found:', paymentError);
      throw new Error('Payment not found');
    }

    // Get company payment configuration
    const { data: config, error: configError } = await supabaseServiceClient
      .from('payment_provider_configs')
      .select('*')
      .eq('company_id', payment.company_id)
      .eq('provider', 'tmb_educacao')
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      console.error('Payment config error:', configError);
      throw new Error('Payment provider not configured');
    }

    const credentials = config.credentials as any;
    const isProduction = config.environment === 'production';

    // Check cache first to avoid unnecessary API calls
    const cacheKey = `tmb_status:${payment.id}`;
    const lastChecked = payment.updated_at;
    const now = new Date();
    const timeSinceLastCheck = now.getTime() - new Date(lastChecked).getTime();
    
    // Don't check if we checked less than 5 minutes ago and status is not pending
    if (payment.status !== 'pending' && timeSinceLastCheck < 5 * 60 * 1000) {
      console.log('Skipping API call - recent check for non-pending payment');
      return new Response(JSON.stringify({
        success: true,
        payment: {
          id: payment.id,
          status: payment.status,
          amount_cents: payment.amount_cents,
          boleto_url: payment.boleto_url,
          expiration: payment.boleto_expiration
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const baseUrl = isProduction 
      ? 'https://api.tmbeducacao.com.br/v1'
      : 'https://sandbox-api.tmbeducacao.com.br/v1';

    console.log(`Checking payment status with TMB: ${payment.provider_order_id}`);

    // Check payment status via TMB API with timeout
    const tmbResponse = await fetch(`${baseUrl}/boletos/${payment.provider_order_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${credentials.api_key}`,
        'User-Agent': 'Lovable-Platform/1.0',
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!tmbResponse.ok) {
      const errorText = await tmbResponse.text();
      console.error('TMB API error:', errorText);
      throw new Error(`TMB API error: ${tmbResponse.status} - ${errorText}`);
    }

    const tmbData = await tmbResponse.json();
    console.log('TMB status response:', tmbData);

    // Enhanced status mapping based on TMB API responses
    let newStatus = payment.status;
    const tmbStatus = tmbData.status || tmbData.situacao || tmbData.state;
    
    switch (tmbStatus?.toLowerCase()) {
      case 'paid':
      case 'pago':
      case 'liquidado':
      case 'compensado':
        newStatus = 'paid';
        break;
      case 'expired':
      case 'vencido':
      case 'expirado':
        newStatus = 'expired';
        break;
      case 'cancelled':
      case 'cancelado':
      case 'canceled':
        newStatus = 'cancelled';
        break;
      case 'pending':
      case 'pendente':
      case 'aguardando':
      case 'waiting':
        newStatus = 'pending';
        break;
      case 'processing':
      case 'processando':
      case 'em_processamento':
        newStatus = 'processing';
        break;
      default:
        console.log('Unknown TMB status:', tmbStatus);
        // Keep current status if we don't recognize the TMB status
        break;
    }

    console.log(`Status mapping: TMB="${tmbStatus}" -> Internal="${newStatus}"`);

    // Update payment status if changed
    if (newStatus !== payment.status) {
      await supabaseServiceClient
        .from('payments')
        .update({ status: newStatus })
        .eq('id', paymentId);

      // Process payment if it's now paid
      if (newStatus === 'paid') {
        if (payment.purpose_type === 'coin_topup') {
          // Credit coins for topup
          const coinsToAdd = Math.floor(payment.amount_cents / 100 * config.coins_per_brl);
          
          // Insert transaction
          await supabaseServiceClient
            .from('point_transactions')
            .insert({
              user_id: payment.user_id,
              company_id: payment.company_id,
              action_type: 'boleto_topup',
              points: coinsToAdd,
              coins: coinsToAdd,
              reference_id: paymentId
            });

          // Update user coins
          await supabaseServiceClient
            .from('user_points')
            .upsert({
              user_id: payment.user_id,
              company_id: payment.company_id,
              total_coins: coinsToAdd
            }, {
              onConflict: 'user_id,company_id',
              ignoreDuplicates: false
            });

          // Create notification
          await supabaseServiceClient
            .from('notifications')
            .insert({
              user_id: payment.user_id,
              company_id: payment.company_id,
              type: 'payment_confirmed',
              title: 'Pagamento Confirmado!',
              content: `Seu boleto foi pago e você recebeu ${coinsToAdd} moedas.`
            });

        } else if (payment.purpose_type === 'marketplace_item' && payment.reference_id) {
          // Finalize marketplace purchase
          const metadata = payment.metadata as any;
          await supabaseServiceClient.rpc('finalize_marketplace_purchase_external', {
            p_user_id: payment.user_id,
            p_company_id: payment.company_id,
            p_item_id: payment.reference_id,
            p_payment_id: paymentId,
            p_quantity: metadata.quantity || 1,
            p_delivery: metadata.delivery || {}
          });

          // Create notification
          await supabaseServiceClient
            .from('notifications')
            .insert({
              user_id: payment.user_id,
              company_id: payment.company_id,
              type: 'payment_confirmed',
              title: 'Pagamento Confirmado!',
              content: 'Seu boleto foi pago e sua compra foi processada.'
            });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      payment: {
        id: payment.id,
        status: newStatus,
        amount_cents: payment.amount_cents,
        boleto_url: payment.boleto_url,
        expiration: payment.boleto_expiration
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in tmb-check-status:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});