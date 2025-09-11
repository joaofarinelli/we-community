import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash, createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-tmb-signature',
};

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (ip: string, limit = 100, windowMs = 60000): boolean => {
  const now = Date.now();
  const key = `rate_limit:${ip}`;
  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count++;
  return true;
};

const verifyWebhookSignature = (payload: string, signature: string, secret: string): boolean => {
  if (!secret || !signature) return false;
  
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = `sha256=${hmac.digest('hex')}`;
  
  return signature === expectedSignature;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payloadText = await req.text();
    const webhookData = JSON.parse(payloadText);

    console.log('TMB Webhook received:', {
      event: webhookData.event,
      boleto_id: webhookData.boleto_id,
      timestamp: new Date().toISOString()
    });

    // Validate required fields
    if (!webhookData.boleto_id || !webhookData.event) {
      throw new Error('Missing required webhook fields');
    }

    // Find payment by provider_order_id
    const { data: payment, error: paymentError } = await supabaseServiceClient
      .from('payments')
      .select('*, company_id')
      .eq('provider_order_id', webhookData.boleto_id)
      .eq('provider', 'tmb_educacao')
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found for boleto_id:', webhookData.boleto_id);
      // Return success to TMB to avoid retries for unknown payments
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get payment config for webhook verification
    const { data: config } = await supabaseServiceClient
      .from('payment_provider_configs')
      .select('webhook_secret')
      .eq('company_id', payment.company_id)
      .eq('provider', 'tmb_educacao')
      .single();

    // Verify webhook signature if secret is configured
    const signature = req.headers.get('x-tmb-signature');
    if (config?.webhook_secret) {
      if (!verifyWebhookSignature(payloadText, signature || '', config.webhook_secret)) {
        console.error('Webhook signature verification failed');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Map TMB webhook events to payment status
    let newStatus = payment.status;
    switch (webhookData.event) {
      case 'boleto.paid':
      case 'payment.confirmed':
        newStatus = 'paid';
        break;
      case 'boleto.expired':
        newStatus = 'expired';
        break;
      case 'boleto.cancelled':
        newStatus = 'cancelled';
        break;
      default:
        console.log('Unhandled webhook event:', webhookData.event);
        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Update payment status if changed
    if (newStatus !== payment.status) {
      console.log(`Updating payment ${payment.id} status from ${payment.status} to ${newStatus}`);
      
      await supabaseServiceClient
        .from('payments')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          webhook_data: webhookData
        })
        .eq('id', payment.id);

      // Process payment if it's now paid
      if (newStatus === 'paid') {
        console.log('Processing paid payment:', payment.id);
        
        if (payment.purpose_type === 'coin_topup') {
          // Use the existing tmb-check-status logic to process the topup
          await supabaseServiceClient.functions.invoke('tmb-check-status', {
            body: { paymentId: payment.id }
          });
        } else if (payment.purpose_type === 'marketplace_item' && payment.reference_id) {
          // Process marketplace purchase
          const metadata = payment.metadata as any;
          await supabaseServiceClient.rpc('finalize_marketplace_purchase_external', {
            p_user_id: payment.user_id,
            p_company_id: payment.company_id,
            p_item_id: payment.reference_id,
            p_payment_id: payment.id,
            p_quantity: metadata?.quantity || 1,
            p_delivery: metadata?.delivery || {}
          });

          // Create notification
          await supabaseServiceClient
            .from('notifications')
            .insert({
              user_id: payment.user_id,
              company_id: payment.company_id,
              type: 'payment_confirmed',
              title: 'Pagamento Confirmado! 🎉',
              content: 'Seu boleto foi pago e sua compra foi processada com sucesso.'
            });
        }
      }
    }

    // Log webhook for audit
    await supabaseServiceClient
      .from('payment_webhook_logs')
      .insert({
        payment_id: payment.id,
        provider: 'tmb_educacao',
        event_type: webhookData.event,
        webhook_data: webhookData,
        processing_status: 'success',
        processed_at: new Date().toISOString()
      })
      .catch(err => console.error('Failed to log webhook:', err));

    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing TMB webhook:', error);
    
    // Log failed webhook
    try {
      const supabaseServiceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabaseServiceClient
        .from('payment_webhook_logs')
        .insert({
          provider: 'tmb_educacao',
          event_type: 'unknown',
          webhook_data: { error: error.message },
          processing_status: 'failed',
          processed_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Failed to log failed webhook:', logError);
    }

    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      status: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});