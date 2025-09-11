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

    const { 
      companyId, 
      purposeType, 
      referenceId, 
      amountCents, 
      payerData,
      metadata = {}
    } = await req.json();

    console.log('Creating boleto:', { companyId, purposeType, referenceId, amountCents });

    // Get company payment configuration
    const { data: config, error: configError } = await supabaseServiceClient
      .from('payment_provider_configs')
      .select('*')
      .eq('company_id', companyId)
      .eq('provider', 'tmb_educacao')
      .eq('is_active', true)
      .maybeSingle();

    if (configError || !config) {
      console.error('Payment config error:', configError);
      throw new Error('Payment provider not configured for this company');
    }

    const credentials = config.credentials as any;
    const isProduction = config.environment === 'production';

    // TMB Educacao API base URL - you'll need to update this with the actual URL
    const baseUrl = isProduction 
      ? 'https://api.tmbeducacao.com.br/v1'  // Replace with actual production URL
      : 'https://sandbox-api.tmbeducacao.com.br/v1';  // Replace with actual sandbox URL

    // Create boleto via TMB API - you'll need to update this with actual API structure
    const boletoPayload = {
      valor: amountCents / 100, // Convert cents to BRL
      vencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days
      pagador: {
        nome: payerData.name,
        cpf: payerData.cpf,
        email: payerData.email || user.email,
        endereco: payerData.address ? {
          logradouro: payerData.address.street,
          numero: payerData.address.number,
          bairro: payerData.address.neighborhood,
          cidade: payerData.address.city,
          uf: payerData.address.state,
          cep: payerData.address.postal_code
        } : undefined
      },
      descricao: purposeType === 'coin_topup' 
        ? `Recarga de moedas - ${amountCents / 100} moedas`
        : 'Compra no marketplace'
    };

    console.log('TMB API payload:', boletoPayload);

    // Make API call to TMB (replace with actual API endpoint and authentication)
    const tmbResponse = await fetch(`${baseUrl}/boletos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${credentials.api_key}`, // Replace with actual auth method
        // Add other required headers based on TMB API documentation
      },
      body: JSON.stringify(boletoPayload)
    });

    if (!tmbResponse.ok) {
      const errorText = await tmbResponse.text();
      console.error('TMB API error:', errorText);
      throw new Error(`TMB API error: ${tmbResponse.status} - ${errorText}`);
    }

    const tmbData = await tmbResponse.json();
    console.log('TMB API response:', tmbData);

    // Insert payment record using service role
    const { data: payment, error: paymentError } = await supabaseServiceClient
      .from('payments')
      .insert({
        company_id: companyId,
        user_id: user.id,
        provider: 'tmb_educacao',
        purpose_type: purposeType,
        reference_id: referenceId,
        amount_cents: amountCents,
        currency: 'BRL',
        status: 'pending',
        provider_order_id: tmbData.id || tmbData.boleto_id, // Adjust based on TMB response
        boleto_url: tmbData.url || tmbData.boleto_url, // Adjust based on TMB response
        barcode: tmbData.codigo_barras || tmbData.barcode, // Adjust based on TMB response
        linha_digitavel: tmbData.linha_digitavel || tmbData.linha_digitavel, // Adjust based on TMB response
        boleto_expiration: tmbData.vencimento || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        payer_data: payerData,
        metadata: metadata
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      throw new Error('Failed to create payment record');
    }

    return new Response(JSON.stringify({
      success: true,
      payment: {
        id: payment.id,
        boleto_url: payment.boleto_url,
        barcode: payment.barcode,
        linha_digitavel: payment.linha_digitavel,
        expiration: payment.boleto_expiration,
        amount_cents: payment.amount_cents
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in tmb-create-boleto:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});