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
  nome: string;
  descricao?: string;
  preco: number;
  categoria?: string;
  ativo: boolean;
  estoque?: number;
  imagem_url?: string;
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

    // Buscar categoria padrão para produtos TMB ou criar uma
    let { data: category, error: categoryError } = await supabase
      .from('marketplace_categories')
      .select('*')
      .eq('company_id', companyId)
      .eq('name', 'Produtos TMB')
      .maybeSingle();

    if (!category) {
      console.log('TMB Sync Products: Criando categoria padrão para produtos TMB');
      const { data: newCategory, error: createCategoryError } = await supabase
        .from('marketplace_categories')
        .insert({
          company_id: companyId,
          name: 'Produtos TMB',
          description: 'Produtos sincronizados da TMB Educação',
          color: '#0066CC',
          icon_library: 'lucide',
          icon_value: 'Package',
          order_index: 0,
          is_active: true,
          created_by: createdBy
        })
        .select()
        .single();

      if (createCategoryError) {
        console.error('TMB Sync Products: Erro ao criar categoria:', createCategoryError);
        throw createCategoryError;
      }
      category = newCategory;
    }

    let syncedCount = 0;
    let updatedCount = 0;
    let errors: string[] = [];

    // Sincronizar cada produto
    for (const product of tmbProducts) {
      try {
        console.log(`TMB Sync Products: Processando produto ${product.id} - ${product.nome}`);

        // Verificar se produto já existe (pelo TMB ID no seller_id)
        const { data: existingProduct } = await supabase
          .from('marketplace_items')
          .select('*')
          .eq('company_id', companyId)
          .eq('seller_id', product.id)
          .eq('seller_type', 'tmb_educacao')
          .maybeSingle();

        const productData = {
          company_id: companyId,
          category_id: category.id,
          name: product.nome,
          description: product.descricao || '',
          price_coins: Math.floor(product.preco * (paymentConfig.coins_per_brl || 1)),
          seller_id: product.id,
          seller_type: 'tmb_educacao',
          store_type: 'marketplace',
          item_type: 'digital',
          is_active: product.ativo,
          stock_quantity: product.estoque || null,
          image_url: product.imagem_url || null,
          moderation_status: 'approved',
          is_featured: false,
          access_tags: ['tmb_products']
        };

        if (existingProduct) {
          // Atualizar produto existente
          const { error: updateError } = await supabase
            .from('marketplace_items')
            .update({
              ...productData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingProduct.id);

          if (updateError) {
            console.error(`TMB Sync Products: Erro ao atualizar produto ${product.id}:`, updateError);
            errors.push(`Erro ao atualizar ${product.nome}: ${updateError.message}`);
          } else {
            updatedCount++;
            console.log(`TMB Sync Products: Produto ${product.nome} atualizado com sucesso`);
          }
        } else {
          // Criar novo produto
          const { error: insertError } = await supabase
            .from('marketplace_items')
            .insert({
              ...productData,
              created_by: 'tmb_sync_system'
            });

          if (insertError) {
            console.error(`TMB Sync Products: Erro ao criar produto ${product.id}:`, insertError);
            errors.push(`Erro ao criar ${product.nome}: ${insertError.message}`);
          } else {
            syncedCount++;
            console.log(`TMB Sync Products: Produto ${product.nome} criado com sucesso`);
          }
        }
      } catch (error) {
        console.error(`TMB Sync Products: Erro ao processar produto ${product.id}:`, error);
        errors.push(`Erro ao processar ${product.nome}: ${error.message}`);
      }
    }

    console.log(`TMB Sync Products: Sincronização concluída. ${syncedCount} criados, ${updatedCount} atualizados`);

    return new Response(JSON.stringify({
      success: true,
      message: `Sincronização concluída com sucesso`,
      data: {
        total_products: tmbProducts.length,
        synced_count: syncedCount,
        updated_count: updatedCount,
        errors: errors
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