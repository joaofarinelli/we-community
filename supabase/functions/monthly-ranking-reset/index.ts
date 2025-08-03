import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Monthly ranking reset function started");

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log("Processing monthly ranking reset for all companies");

    // Get all active companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('status', 'active');

    if (companiesError) {
      console.error('Error fetching companies:', companiesError);
      throw companiesError;
    }

    if (!companies || companies.length === 0) {
      console.log('No active companies found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active companies found',
          companiesProcessed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`Found ${companies.length} active companies to process`);

    let processedCount = 0;
    let errorCount = 0;

    // Process each company
    for (const company of companies) {
      try {
        console.log(`Processing company: ${company.name} (${company.id})`);
        
        // Call the reset function for this company
        const { error: resetError } = await supabase.rpc('reset_monthly_coins', {
          p_company_id: company.id
        });

        if (resetError) {
          console.error(`Error resetting coins for company ${company.name}:`, resetError);
          errorCount++;
        } else {
          console.log(`Successfully reset monthly coins for company: ${company.name}`);
          processedCount++;
        }
      } catch (error) {
        console.error(`Error processing company ${company.name}:`, error);
        errorCount++;
      }
    }

    console.log(`Monthly reset completed. Processed: ${processedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Monthly ranking reset completed',
        companiesProcessed: processedCount,
        errorsEncountered: errorCount,
        totalCompanies: companies.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in monthly ranking reset:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});