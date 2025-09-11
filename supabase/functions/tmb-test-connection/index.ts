import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TMB Educação API validation
const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  
  // Check for repeated digits
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  // Validate checksum
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  return digit === parseInt(cleanCPF[10]);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { environment, credentials } = await req.json();

    if (!credentials?.api_key || !credentials?.api_secret) {
      throw new Error('API Key e API Secret são obrigatórios');
    }

    const isProduction = environment === 'production';
    
    // TMB Educação API endpoints - Update with actual URLs from documentation
    const baseUrl = isProduction 
      ? 'https://api.tmbeducacao.com.br/v1'
      : 'https://sandbox-api.tmbeducacao.com.br/v1';

    console.log(`Testing TMB connection - Environment: ${environment}`);

    // Test connection with a simple API call (adjust based on TMB API docs)
    const testResponse = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${credentials.api_key}`,
        'X-API-Secret': credentials.api_secret, // Adjust based on TMB auth method
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('TMB API test failed:', errorText);
      
      // Map common error codes
      if (testResponse.status === 401) {
        throw new Error('Credenciais inválidas - verifique API Key e Secret');
      } else if (testResponse.status === 403) {
        throw new Error('Acesso negado - verifique permissões da API');
      } else if (testResponse.status === 404) {
        throw new Error('Endpoint não encontrado - verifique o ambiente selecionado');
      } else if (testResponse.status >= 500) {
        throw new Error('Erro interno do TMB - tente novamente mais tarde');
      } else {
        throw new Error(`Erro TMB: ${testResponse.status} - ${errorText}`);
      }
    }

    const testData = await testResponse.json();
    console.log('TMB connection test successful:', testData);

    return new Response(JSON.stringify({
      success: true,
      message: 'Conexão com TMB Educação estabelecida com sucesso',
      environment: environment,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error testing TMB connection:', error);
    
    // Handle timeout errors
    if (error.name === 'TimeoutError') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Timeout - TMB não respondeu em 10 segundos'
      }), {
        status: 408,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Erro desconhecido ao testar conexão'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});