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
import { useSubdomain } from '@/hooks/useSubdomain';

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export const LoginForm = ({ onSwitchToSignup }: LoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { subdomain, customDomain } = useSubdomain();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Aggressive session cleanup function
  const forceSessionCleanup = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear specific Supabase keys if they still exist
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('Forced session cleanup completed');
    } catch (error) {
      console.error('Error during forced cleanup:', error);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      let targetCompany = null;

      console.log('Login attempt - subdomain:', subdomain, 'customDomain:', customDomain);

      // Use the domain detection from useSubdomain hook
      if (customDomain) {
        console.log('Looking for company with custom_domain:', customDomain);
        const { data: customDomainCompany, error } = await supabase
          .from('companies')
          .select('*')
          .eq('custom_domain', customDomain)
          .single();
        
        if (error) {
          console.log('Custom domain query error:', error);
        }
        targetCompany = customDomainCompany;
        console.log('Custom domain check:', targetCompany?.name || 'not found');
      } else if (subdomain) {
        console.log('Looking for company with subdomain:', subdomain);
        const { data: subdomainCompany, error } = await supabase
          .from('companies')
          .select('*')
          .eq('subdomain', subdomain)
          .single();
        
        if (error) {
          console.log('Subdomain query error:', error);
        }
        targetCompany = subdomainCompany;
        console.log('Subdomain check:', subdomain, '->', targetCompany?.name || 'not found');
      }

      // If we're on a company domain, validate access BEFORE login
      if (targetCompany) {
        console.log('Pre-validating access to company:', targetCompany.name);
        
        // Check which user_id this email should use for this company
        const { data: targetProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', data.email)
          .eq('company_id', targetCompany.id)
          .single();

        if (!targetProfile) {
          toast({
            variant: "destructive",
            title: "Acesso negado",
            description: `Você não tem acesso à ${targetCompany.name}. Entre em contato com um administrador.`,
          });
          return;
        }

        console.log('Target profile found. Required user_id:', targetProfile.user_id);
        
        // Store the target user_id for validation after login
        sessionStorage.setItem('expected_user_id', targetProfile.user_id);
        sessionStorage.setItem('expected_company_id', targetCompany.id);
      }

      // Perform login
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        sessionStorage.removeItem('expected_user_id');
        sessionStorage.removeItem('expected_company_id');
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: error.message === 'Invalid login credentials' 
            ? 'Email ou senha incorretos' 
            : error.message,
        });
        return;
      }

      // Validate the logged-in user matches the expected user_id for this domain
      const expectedUserId = sessionStorage.getItem('expected_user_id');
      const expectedCompanyId = sessionStorage.getItem('expected_company_id');
      
      if (expectedUserId && authData.user && authData.user.id !== expectedUserId) {
        console.log('User ID mismatch after login. Expected:', expectedUserId, 'Got:', authData.user.id);
        
        // Force aggressive session cleanup
        await forceSessionCleanup();
        
        toast({
          variant: "destructive",
          title: "Conta incorreta",
          description: `Esta conta não tem acesso à ${targetCompany?.name}. Use a conta correta para esta empresa.`,
        });
        return;
      }

      // Clear session storage after successful validation
      sessionStorage.removeItem('expected_user_id');
      sessionStorage.removeItem('expected_company_id');

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta ao CommunityHub",
      });
    } catch (error) {
      console.error('Login error:', error);
      sessionStorage.removeItem('expected_user_id');
      sessionStorage.removeItem('expected_company_id');
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