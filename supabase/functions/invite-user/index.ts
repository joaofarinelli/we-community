import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-company-id",
};

interface InviteRequest {
  email: string;
  role: 'admin' | 'member';
  courseAccess: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's company and verify admin status
    // For multi-company users, we need to get the company_id from the request context
    const userAgent = req.headers.get('user-agent') || '';
    let companyId: string | null = null;
    
    // Extract company_id from request headers if available
    const companyHeader = req.headers.get('x-company-id');
    if (companyHeader) {
      companyId = companyHeader;
    } else {
      // Fallback: get the first company for single-company users
      const { data: profiles, error: profilesError } = await supabaseClient
        .from("profiles")
        .select("company_id, role")
        .eq("user_id", user.id)
        .eq("is_active", true);
      
      if (profilesError || !profiles || profiles.length === 0) {
        return new Response(JSON.stringify({ error: "No active profile found" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      companyId = profiles[0].company_id;
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("company_id, role")
      .eq("user_id", user.id)
      .eq("company_id", companyId)
      .eq("is_active", true)
      .single();

    if (profileError || !profile || !['owner', 'admin'].includes(profile.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, role, courseAccess }: InviteRequest = await req.json();

    // Check if user already exists
    const { data: existingProfile } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("email", email)
      .eq("company_id", profile.company_id)
      .single();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: "User already exists in this company" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate invite token
    const { data: tokenData, error: tokenError } = await supabaseClient
      .rpc("generate_invite_token");

    if (tokenError) {
      throw new Error("Failed to generate token");
    }

    const token = tokenData;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Create invite record
    const { data: invite, error: inviteError } = await supabaseClient
      .from("user_invites")
      .insert({
        company_id: profile.company_id,
        invited_by: user.id,
        email,
        role,
        course_access: courseAccess,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Error creating invite:", inviteError);
      throw new Error("Failed to create invite");
    }

    // Get company details for email
    const { data: company } = await supabaseClient
      .from("companies")
      .select("name")
      .eq("id", profile.company_id)
      .single();

    // Send email using Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const inviteUrl = `${Deno.env.get("SUPABASE_URL")?.replace('https://', 'https://').replace('.supabase.co', '.netlify.app') || 'https://your-app.netlify.app'}/invite/accept/${token}`;

    const emailResponse = await resend.emails.send({
      from: "Convite <onboarding@resend.dev>",
      to: [email],
      subject: `Convite para ${company?.name || 'nossa plataforma'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Você foi convidado!</h1>
          <p>Você foi convidado para se juntar a <strong>${company?.name || 'nossa plataforma'}</strong> como <strong>${role === 'admin' ? 'Administrador' : 'Membro'}</strong>.</p>
          ${courseAccess.length > 0 ? `<p>Você terá acesso aos seguintes cursos específicos.</p>` : ''}
          <div style="margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Aceitar Convite
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Este convite expira em 7 dias. Se você não conseguir clicar no botão, copie e cole este link no seu navegador:
            <br><br>
            <code style="background-color: #f4f4f4; padding: 4px 8px; border-radius: 4px;">${inviteUrl}</code>
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invite: { id: invite.id, email, role, expires_at: invite.expires_at } 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error in invite-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);