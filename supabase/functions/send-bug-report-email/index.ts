import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BugReportEmailRequest {
  bugReport: {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    user_agent?: string;
    url?: string;
    created_at: string;
  };
  userInfo: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
  companyInfo: {
    name: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY não configurado");
    }

    const { bugReport, userInfo, companyInfo }: BugReportEmailRequest = await req.json();

    // Get bug reports configuration from super admin settings
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: configData, error: configError } = await supabaseAdmin
      .from('super_admin_configs')
      .select('config_value')
      .eq('config_key', 'bug_reports')
      .single();

    if (configError) {
      console.log("Error fetching bug reports config:", configError);
      return new Response(
        JSON.stringify({ success: true, message: "No config found, bug report saved but no email sent" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const bugReportsConfig = configData?.config_value;
    
    // Check if bug reports are enabled and email is configured
    if (!bugReportsConfig?.enabled || !bugReportsConfig?.email) {
      console.log("Bug reports disabled or no email configured, skipping email");
      return new Response(
        JSON.stringify({ success: true, message: "Bug reports disabled or no email configured" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const recipientEmail = bugReportsConfig.email;

    const priorityLabels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      critical: 'Crítica'
    };

    const categoryLabels = {
      bug: 'Bug / Erro',
      feature: 'Solicitação de funcionalidade',
      performance: 'Problema de performance',
      ui: 'Problema de interface',
      accessibility: 'Acessibilidade',
      other: 'Outro'
    };

    const userName = userInfo.first_name && userInfo.last_name 
      ? `${userInfo.first_name} ${userInfo.last_name}`
      : userInfo.email;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🐛 Novo Bug Report</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Relatório de problema recebido - ${companyInfo.name}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
          <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0; font-size: 18px;">${bugReport.title}</h2>
            <div style="margin: 15px 0;">
              <span style="display: inline-block; background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 8px;">
                ${categoryLabels[bugReport.category as keyof typeof categoryLabels] || bugReport.category}
              </span>
              <span style="display: inline-block; background: ${bugReport.priority === 'critical' ? '#ffebee' : bugReport.priority === 'high' ? '#fff3e0' : '#f3e5f5'}; color: ${bugReport.priority === 'critical' ? '#c62828' : bugReport.priority === 'high' ? '#ef6c00' : '#7b1fa2'}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                Prioridade: ${priorityLabels[bugReport.priority as keyof typeof priorityLabels] || bugReport.priority}
              </span>
            </div>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; border-left: 4px solid #2196f3;">
              <p style="margin: 0; color: #444; line-height: 1.6; white-space: pre-wrap;">${bugReport.description}</p>
            </div>
          </div>

          <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #333; margin-top: 0; font-size: 16px;">👤 Informações do Usuário</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Nome:</strong> ${userName}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${userInfo.email}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Data:</strong> ${new Date(bugReport.created_at).toLocaleString('pt-BR')}</p>
          </div>

          ${bugReport.url || bugReport.user_agent ? `
          <div style="background: white; padding: 20px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #333; margin-top: 0; font-size: 16px;">🔧 Informações Técnicas</h3>
            ${bugReport.url ? `<p style="margin: 5px 0; color: #666;"><strong>Página:</strong> <a href="${bugReport.url}" style="color: #1976d2; text-decoration: none;">${bugReport.url}</a></p>` : ''}
            ${bugReport.user_agent ? `<p style="margin: 5px 0; color: #666; word-break: break-all;"><strong>User Agent:</strong> ${bugReport.user_agent}</p>` : ''}
          </div>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>Este email foi enviado automaticamente pelo sistema de bug reports de ${companyInfo.name}</p>
          <p>ID do Report: ${bugReport.id}</p>
        </div>
      </div>
    `;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "Bug Reports <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: `🐛 [${companyInfo.name}] ${bugReport.title}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Bug report email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, emailResponse: emailResult }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error sending bug report email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);