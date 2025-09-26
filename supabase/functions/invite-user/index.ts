import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-company-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InviteRequest {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: 'admin' | 'member';
  courseAccess: string[];
}

// Helper to decode JWT payload (base64url)
const decodeJwtPayload = (jwtToken: string) => {
  try {
    const payload = jwtToken.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

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
          headers: { 
            Authorization: req.headers.get("Authorization")!,
            "x-company-id": req.headers.get("x-company-id") || ""
          },
        },
      }
    );

    // Resolve authenticated user from Authorization header without calling /user
    const authHeader = req.headers.get('Authorization') || '';
    const authToken = authHeader.replace('Bearer ', '').trim();
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const jwt = decodeJwtPayload(authToken);
    const userId = jwt?.sub as string | undefined;
    const userEmail = (jwt?.email as string | undefined) || null;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        .eq("user_id", userId)
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
      .eq("user_id", userId)
      .eq("company_id", companyId)
      .eq("is_active", true)
      .single();

    if (profileError || !profile || !['owner', 'admin'].includes(profile.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, first_name, last_name, password, role, courseAccess }: InviteRequest = await req.json();

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
    console.log("Generating invite token...");
    const { data: inviteTokenData, error: tokenError } = await supabaseClient
      .rpc("generate_invite_token");

    if (tokenError) {
      console.error("Token generation error:", tokenError);
      throw new Error("Failed to generate token");
    }

    const inviteToken = inviteTokenData || crypto.randomUUID().replace(/-/g, '');
    console.log("Invite token generated successfully");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Set company context for multi-company users
    const { error: contextError } = await supabaseClient.rpc('set_current_company_context', {
      p_company_id: profile.company_id
    });

    if (contextError) {
      console.error("Error setting company context:", contextError);
      throw new Error("Failed to set company context");
    }

    // Create invite record
    const { data: invite, error: inviteError } = await supabaseClient
      .from("user_invites")
      .insert({
        company_id: profile.company_id,
        invited_by: userId,
        email,
        role,
        course_access: courseAccess,
        token: inviteToken,
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

    // Send email using Resend API
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured, skipping email");
    } else {
      // Build the invite URL based on the current request origin
      const origin = req.headers.get('origin') || req.headers.get('referer') || 'https://app.lovable.dev';
      const inviteUrl = `${origin}/invite/accept/${inviteToken}`;

      console.log("Sending email to:", email);
      console.log("Invite URL:", inviteUrl);
      
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
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
          }),
        });

        if (emailResponse.ok) {
          console.log("Email sent successfully");
        } else {
          const errorText = await emailResponse.text();
          console.error("Failed to send email:", errorText);
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    }

    // Send data to webhook
    try {
      // Build the invite URL for webhook
      const origin = req.headers.get('origin') || req.headers.get('referer') || 'https://app.lovable.dev';
      const webhookInviteUrl = `${origin}/invite/accept/${inviteToken}`;
      
      const webhookData = {
        event: 'user_invited',
        invite: {
          id: invite.id,
          email,
          first_name,
          last_name,
          password,
          role,
          course_access: courseAccess,
          token: inviteToken,
          expires_at: expiresAt.toISOString(),
          invite_url: webhookInviteUrl,
          created_at: invite.created_at
        },
        company: {
          id: profile.company_id,
          name: company?.name || null
        },
        invited_by: {
          id: userId,
          email: userEmail
        },
        timestamp: new Date().toISOString()
      };

      const webhookResponse = await fetch('https://webhook.weplataforma.com.br/webhook/b6b32961-bc18-4b5b-a098-063780594e35', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      if (!webhookResponse.ok) {
        console.error("Webhook failed:", webhookResponse.status, await webhookResponse.text());
      } else {
        console.log("Webhook sent successfully");
      }
    } catch (webhookError) {
      console.error("Error sending webhook:", webhookError);
      // Don't fail the invitation if webhook fails
    }

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