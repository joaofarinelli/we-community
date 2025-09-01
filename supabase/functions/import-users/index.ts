import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { Resend } from 'npm:resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-company-id',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

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
  if (lines.length < 2) return []
  
  // Better CSV parsing that handles quoted values and different separators
  const parseLine = (line: string) => {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if ((char === ',' || char === ';') && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }
  
  const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim())
  
  return lines.slice(1).filter(line => line.trim()).map((line, index) => {
    const values = parseLine(line)
    const obj: any = { _lineNumber: index + 2 }
    headers.forEach((header, i) => {
      obj[header] = values[i] || ''
    })
    return obj
  })
}

async function sendInviteEmail(email: string, firstName: string, token: string, companyName: string) {
  try {
    const inviteUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token}&type=invite&redirect_to=${Deno.env.get('SITE_URL') || 'https://app.example.com'}/register`
    
    await resend.emails.send({
      from: `${companyName} <noreply@resend.dev>`,
      to: [email],
      subject: `Você foi convidado(a) para ${companyName}`,
      html: `
        <h1>Bem-vindo(a), ${firstName}!</h1>
        <p>Você foi convidado(a) para fazer parte da ${companyName}.</p>
        <p>Clique no link abaixo para criar sua conta:</p>
        <a href="${inviteUrl}" style="background: #334155; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Aceitar Convite
        </a>
        <p><small>Este convite expira em 7 dias.</small></p>
      `,
    })
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const companyId = req.headers.get('x-company-id')
    
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

    // Use company context if provided, otherwise use user's company
    const targetCompanyId = companyId || profile.company_id

    // Get company details for email
    const { data: company } = await supabaseClient
      .from('companies')
      .select('name')
      .eq('id', targetCompanyId)
      .single()

    const companyName = company?.name || 'Empresa'

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
      totalProcessed: users.length,
      successful: 0,
      invited: 0,
      skipped: 0,
      errors: [] as Array<{ line: number; email: string; error: string }>,
      duplicates: [] as Array<{ line: number; email: string }>,
      details: [] as Array<{ line: number; email: string; status: string; firstName?: string; lastName?: string }>
    }

    // Process each user
    for (const userData of users) {
      const lineNumber = userData._lineNumber || users.indexOf(userData) + 2
      
      try {
        // Map various column formats
        const email = (userData.email || userData.Email || userData.EMAIL || '').trim()
        const firstName = (userData.nome || userData.first_name || userData.firstName || userData.Nome || userData['primeiro nome'] || userData.primeiro_nome || '').trim()
        const lastName = (userData.sobrenome || userData.last_name || userData.lastName || userData.Sobrenome || userData['último nome'] || userData.ultimo_nome || '').trim()
        const phone = (userData.telefone || userData.phone || userData.Telefone || userData.celular || '').trim()
        const role = (userData.cargo || userData.role || userData.Cargo || userData.função || userData.funcao || 'member').trim().toLowerCase()

        if (!email || !email.includes('@')) {
          results.errors.push({
            line: lineNumber,
            email: email || 'N/A',
            error: 'Email inválido ou não informado'
          })
          continue
        }

        if (!firstName) {
          results.errors.push({
            line: lineNumber,
            email: email,
            error: 'Nome é obrigatório'
          })
          continue
        }

        // Check if email already exists in profiles
        const { data: existingProfile } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('company_id', targetCompanyId)
          .ilike('email', email)
          .single()

        if (existingProfile) {
          results.duplicates.push({ line: lineNumber, email })
          results.details.push({
            line: lineNumber,
            email,
            status: 'duplicate',
            firstName,
            lastName
          })
          results.skipped++
          continue
        }

        // Check if invite already exists
        const { data: existingInvite } = await supabaseClient
          .from('user_invites')
          .select('id, status')
          .eq('company_id', targetCompanyId)
          .ilike('email', email)
          .eq('status', 'pending')
          .single()

        if (existingInvite) {
          results.duplicates.push({ line: lineNumber, email })
          results.details.push({
            line: lineNumber,
            email,
            status: 'invite_pending',
            firstName,
            lastName
          })
          results.skipped++
          continue
        }

        // Generate token using RPC function
        const { data: tokenData, error: tokenError } = await supabaseClient
          .rpc('generate_invite_token')

        if (tokenError || !tokenData) {
          results.errors.push({
            line: lineNumber,
            email,
            error: 'Erro ao gerar token de convite'
          })
          continue
        }

        // Create user invite
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        const { error: inviteError } = await supabaseClient
          .from('user_invites')
          .insert({
            company_id: targetCompanyId,
            email: email.toLowerCase(),
            role: ['owner', 'admin', 'member'].includes(role) ? role : 'member',
            invited_by: user.id,
            status: 'pending',
            token: tokenData,
            expires_at: expiresAt.toISOString(),
            course_access: []
          })

        if (inviteError) {
          console.error('Error creating invite:', inviteError)
          results.errors.push({
            line: lineNumber,
            email,
            error: `Erro ao criar convite: ${inviteError.message}`
          })
          continue
        }

        // Send invitation email
        const emailSent = await sendInviteEmail(email, firstName, tokenData, companyName)
        
        results.successful++
        results.invited++
        results.details.push({
          line: lineNumber,
          email,
          status: emailSent ? 'invited' : 'invited_no_email',
          firstName,
          lastName
        })

        if (!emailSent) {
          console.warn(`Email not sent for ${email}`)
        }

      } catch (error) {
        console.error('Error processing user:', error)
        results.errors.push({
          line: lineNumber,
          email: userData.email || 'N/A',
          error: `Erro interno: ${error}`
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Importação concluída',
        results
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