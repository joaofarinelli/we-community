import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseContext } from "@/hooks/useSupabaseContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  firstName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  lastName: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação de senha é obrigatória"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

interface InviteData {
  email: string;
  role: string;
  company_name?: string;
  course_access: string[];
}

export const InviteAcceptPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Initialize Supabase context for multi-company users
  useSupabaseContext();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const fetchInviteData = async () => {
      if (!token) {
        toast({
          title: "Token inválido",
          description: "O link de convite é inválido.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_invites")
          .select(`
            email,
            role,
            course_access,
            status,
            expires_at,
            companies!inner(name)
          `)
          .eq("token", token)
          .single();

        if (error || !data) {
          throw new Error("Convite não encontrado");
        }

        if (data.status !== "pending") {
          throw new Error("Este convite já foi utilizado ou cancelado");
        }

        if (new Date(data.expires_at) < new Date()) {
          throw new Error("Este convite expirou");
        }

        const courseAccess = data.course_access;
        const courseAccessArray = Array.isArray(courseAccess) 
          ? courseAccess.map(item => typeof item === 'string' ? item : String(item))
          : [];
          
        setInviteData({
          email: data.email,
          role: data.role,
          company_name: data.companies?.name,
          course_access: courseAccessArray,
        });
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error.message || "Não foi possível carregar o convite.",
          variant: "destructive",
        });
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    fetchInviteData();
  }, [token, toast, navigate]);

  const onSubmit = async (data: FormData) => {
    if (!token || !inviteData) return;

    setSubmitting(true);
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteData.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Process invite acceptance
        const { data: result, error: processError } = await supabase
          .rpc('process_invite_acceptance', {
            p_token: token,
            p_user_id: authData.user.id,
            p_first_name: data.firstName,
            p_last_name: data.lastName,
          });

        if (processError) throw processError;

        const resultData = result as any;
        if (!resultData?.success) {
          throw new Error(resultData?.error || "Erro ao processar convite");
        }

        toast({
          title: "Conta criada com sucesso!",
          description: "Bem-vindo! Sua conta foi criada e você já está logado.",
        });

        // Redirect to dashboard
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Ocorreu um erro ao criar sua conta.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!inviteData) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Aceitar Convite</CardTitle>
          <CardDescription>
            Você foi convidado para se juntar a <strong>{inviteData.company_name}</strong> como{" "}
            <strong>{inviteData.role === 'admin' ? 'Administrador' : 'Membro'}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={inviteData.email} disabled />
              </div>

              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobrenome</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu sobrenome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Sua senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirme sua senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {inviteData.course_access.length > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Você terá acesso aos seguintes cursos:</p>
                  <p className="text-sm text-muted-foreground">
                    {inviteData.course_access.length} curso(s) selecionado(s)
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Criar Conta e Aceitar Convite"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};