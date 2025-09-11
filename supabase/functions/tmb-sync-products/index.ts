import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-company-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface TMBProduct {
  id: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  image_url?: string;
  stock_quantity?: number;
}

serve(async (req) => {
  console.log('TMB Sync Products: Iniciando sincronização');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { companyId } = await req.json();
    console.log('TMB Sync Products: Company ID:', companyId);

    if (!companyId) {
      throw new Error('Company ID é obrigatório');
    }

    // Buscar configuração de pagamento da empresa
    const { data: paymentConfig, error: configError } = await supabase
      .from('payment_provider_configs')
      .select('*')
      .eq('company_id', companyId)
      .eq('provider', 'tmb_educacao')
      .maybeSingle();

    if (configError || !paymentConfig) {
      console.error('TMB Sync Products: Erro ao buscar configuração:', configError);
      throw new Error('Configuração TMB não encontrada para esta empresa');
    }

    const apiKey = paymentConfig.credentials?.api_key;
    if (!apiKey) {
      throw new Error('API Key TMB não configurada');
    }

    console.log('TMB Sync Products: Buscando produtos da API TMB...');

    // Fazer requisição para API TMB
    const response = await fetch('https://api.tmbeducacao.com.br/api/produtos', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('TMB Sync Products: Erro na API TMB:', response.status, response.statusText);
      throw new Error(`Erro na API TMB: ${response.status} - ${response.statusText}`);
    }

    const tmbProducts: TMBProduct[] = await response.json();
    console.log(`TMB Sync Products: ${tmbProducts.length} produtos encontrados na API TMB`);

    // Buscar um usuário admin/owner da empresa para usar como created_by
    const { data: adminUser, error: adminError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .in('role', ['owner', 'admin'])
      .limit(1)
      .maybeSingle();

    if (adminError) {
      console.error('TMB Sync Products: Erro ao buscar usuário admin:', adminError);
      throw new Error('Não foi possível encontrar um usuário administrador para a empresa');
    }

    if (!adminUser) {
      throw new Error('Nenhum usuário administrador ativo encontrado para esta empresa');
    }

    const createdBy = adminUser.user_id;
    console.log('TMB Sync Products: Usando created_by:', createdBy);

    let synced_count = 0;
    let updated_count = 0;
    const errors: string[] = [];

    // Processar cada produto TMB
    for (const product of tmbProducts) {
      try {
        // Calcular preço em moedas baseado na configuração
        const priceCoins = Math.round((product.price || 0) * (paymentConfig.coin_conversion_rate || 100));

        // Preparar dados do produto para a tabela tmb_products
        const productData = {
          company_id: companyId,
          tmb_product_id: product.id.toString(),
          name: product.name,
          description: product.description || '',
          price_brl: product.price || 0,
          price_coins: priceCoins,
          category: product.category || 'Geral',
          image_url: product.image_url,
          stock_quantity: product.stock_quantity,
          is_active: true,
          tmb_data: product,
          last_synced_at: new Date().toISOString()
        };

        // Verificar se produto já existe
        const { data: existingProduct } = await supabase
          .from('tmb_products')
          .select('id, created_at')
          .eq('company_id', companyId)
          .eq('tmb_product_id', product.id.toString())
          .maybeSingle();

        let upsertResult;
        let upsertError;

        if (existingProduct) {
          // Atualizar produto existente
          const { data, error } = await supabase
            .from('tmb_products')
            .update({
              name: productData.name,
              description: productData.description,
              price_brl: productData.price_brl,
              price_coins: productData.price_coins,
              category: productData.category,
              image_url: productData.image_url,
              stock_quantity: productData.stock_quantity,
              is_active: productData.is_active,
              tmb_data: productData.tmb_data,
              last_synced_at: productData.last_synced_at
            })
            .eq('id', existingProduct.id)
            .select('id, name')
            .maybeSingle();
          
          upsertResult = data;
          upsertError = error;
        } else {
          // Inserir novo produto
          const { data, error } = await supabase
            .from('tmb_products')
            .insert(productData)
            .select('id, name')
            .maybeSingle();
          
          upsertResult = data;
          upsertError = error;
        }

        if (upsertError) {
          console.error(`TMB Sync Products: Erro ao sincronizar produto ${product.name}:`, upsertError);
          errors.push(`Erro ao sincronizar ${product.name}: ${upsertError.message}`);
        } else {
          if (existingProduct) {
            updated_count++;
            console.log(`TMB Sync Products: Produto atualizado: ${product.name}`);
          } else {
            synced_count++;
            console.log(`TMB Sync Products: Novo produto criado: ${product.name}`);
          }
        }
      } catch (productError) {
        console.error(`TMB Sync Products: Erro ao processar produto ${product.name}:`, productError);
        errors.push(`Erro ao processar ${product.name}: ${productError}`);
      }
    }

    console.log(`TMB Sync Products: Sincronização concluída. ${synced_count} criados, ${updated_count} atualizados`);

    return new Response(JSON.stringify({
      success: true,
      message: `Sincronização concluída com sucesso`,
      data: {
        total_products: tmbProducts.length,
        synced_count,
        updated_count,
        errors
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('TMB Sync Products: Erro geral:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});