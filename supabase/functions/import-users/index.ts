import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
        Insert: {
          id?: string
          user_id: string
          company_id: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_invites: {
        Insert: {
          id?: string
          company_id: string
          email: string
          role?: string
          invited_by: string
          status?: string
          token?: string
          expires_at?: string
          course_access?: any
        }
      }
    }
  }
}

function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.replace(/"/g, '').trim())
    const obj: any = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] || ''
    })
    return obj
  })
}

function generateToken(): string {
  return crypto.randomUUID() + Date.now().toString(36)
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

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Read and parse CSV content
    const csvText = await file.text()
    const users = parseCSV(csvText)
    
    console.log('Parsed users:', users)

    const results = {
      success: 0,
      errors: [] as string[],
      invited: 0
    }

    // Process each user
    for (const userData of users) {
      try {
        const email = userData.Email || userData.email
        const firstName = userData.Nome || userData['first_name'] || userData.primeiro_nome
        const lastName = userData.Sobrenome || userData['last_name'] || userData.sobrenome
        const phone = userData.Telefone || userData.phone
        const role = userData.Cargo || userData.role || 'member'

        if (!email) {
          results.errors.push(`Linha ${users.indexOf(userData) + 2}: Email é obrigatório`)
          continue
        }

        // Check if email already exists in company
        const { data: existingProfile } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('company_id', profile.company_id)
          .eq('email', email)
          .single()

        if (existingProfile) {
          results.errors.push(`Email ${email} já existe na empresa`)
          continue
        }

        // Create user invite
        const token = generateToken()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

        const { error: inviteError } = await supabaseClient
          .from('user_invites')
          .insert({
            company_id: profile.company_id,
            email: email,
            role: role,
            invited_by: user.id,
            status: 'pending',
            token: token,
            expires_at: expiresAt.toISOString(),
            course_access: []
          })

        if (inviteError) {
          console.error('Error creating invite:', inviteError)
          results.errors.push(`Erro ao convidar ${email}: ${inviteError.message}`)
          continue
        }

        results.invited++
        results.success++

      } catch (error) {
        console.error('Error processing user:', error)
        results.errors.push(`Erro ao processar linha ${users.indexOf(userData) + 2}: ${error}`)
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Import completed',
        results: results
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in import-users function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})