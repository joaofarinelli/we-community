import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { LoginFormData, loginSchema } from '@/lib/schemas';
import { Loader2 } from 'lucide-react';

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export const LoginForm = ({ onSwitchToSignup }: LoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      // First, check if this domain has an associated company
      const hostname = window.location.hostname;
      let targetCompany = null;

      console.log('Login attempt from domain:', hostname);

      // Try to find company by custom domain first
      const { data: customDomainCompany } = await supabase
        .from('companies')
        .select('*')
        .eq('custom_domain', hostname)
        .single();

      if (customDomainCompany) {
        targetCompany = customDomainCompany;
        console.log('Found target company by custom domain:', targetCompany.name);
      } else {
        // Try by subdomain
        const parts = hostname.split('.');
        if (parts.length > 2) {
          const subdomain = parts[0];
          const { data: subdomainCompany } = await supabase
            .from('companies')
            .select('*')
            .eq('subdomain', subdomain)
            .single();
          
          if (subdomainCompany) {
            targetCompany = subdomainCompany;
            console.log('Found target company by subdomain:', targetCompany.name);
          }
        }
      }

      // Perform login
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: error.message === 'Invalid login credentials' 
            ? 'Email ou senha incorretos' 
            : error.message,
        });
        return;
      }

      // If we found a target company, verify user has access to it
      if (targetCompany) {
        console.log('Checking user access to company:', targetCompany.name);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', data.email)
          .eq('company_id', targetCompany.id)
          .single();

        if (!profile) {
          // User doesn't have access to this company's domain
          console.log('User does not have access to company:', targetCompany.name);
          await supabase.auth.signOut();
          toast({
            variant: "destructive",
            title: "Acesso negado",
            description: `Você não tem acesso à ${targetCompany.name}. Entre em contato com um administrador.`,
          });
          return;
        }
        
        console.log('User has access to company. Profile user_id:', profile.user_id);
      }

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta ao CommunityHub",
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Tente novamente em alguns instantes",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Fazer Login</h2>
        <p className="text-muted-foreground">
          Entre na sua conta para acessar sua comunidade
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="seu@email.com" {...field} />
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Não tem uma conta?{' '}
          <button
            onClick={onSwitchToSignup}
            className="text-primary hover:underline font-medium"
          >
            Cadastre sua empresa
          </button>
        </p>
      </div>
    </div>
  );
};