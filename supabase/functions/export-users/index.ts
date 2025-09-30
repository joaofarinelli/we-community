import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-company-id',
}

interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          company_id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          role: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get company_id from header or from user profile
    const companyIdHeader = req.headers.get('x-company-id')
    
    // Get user's company and verify admin role
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('company_id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || !['owner', 'admin'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }), 
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Use company_id from header if provided, otherwise use from profile
    const targetCompanyId = companyIdHeader || profile.company_id

    // Verify user has access to the target company
    if (targetCompanyId !== profile.company_id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: No access to this company' }), 
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get all users from the company
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('company_id', targetCompanyId)
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare data for Excel
    const excelData = users?.map(user => {
      return {
        'ID': user.id,
        'Nome': user.first_name || '',
        'Sobrenome': user.last_name || '',
        'Email': user.email || '',
        'Telefone': user.phone || '',
        'Cargo': user.role,
        'Ativo': user.is_active ? 'Sim' : 'Não',
        'Data de Criação': new Date(user.created_at).toLocaleDateString('pt-BR')
      }
    }) || []

    console.log('Preparing Excel with', excelData.length, 'users')

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const columnWidths = [
      { wch: 36 }, // ID
      { wch: 20 }, // Nome
      { wch: 20 }, // Sobrenome
      { wch: 30 }, // Email
      { wch: 15 }, // Telefone
      { wch: 15 }, // Cargo
      { wch: 10 }, // Ativo
      { wch: 18 }  // Data de Criação
    ]
    worksheet['!cols'] = columnWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuários')

    // Generate Excel file as array buffer
    const excelArray = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
    const excelBuffer = new Uint8Array(excelArray)

    console.log('Generated Excel file, size:', excelBuffer.byteLength, 'bytes')

    // Return Excel file
    return new Response(excelBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="usuarios-${new Date().toISOString().split('T')[0]}.xlsx"`,
        'Content-Length': excelBuffer.byteLength.toString()
      }
    })

  } catch (error) {
    console.error('Error in export-users function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})