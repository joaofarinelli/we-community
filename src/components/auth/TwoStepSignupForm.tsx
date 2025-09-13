import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Mail, User, Lock } from 'lucide-react';
import { emailStepSchema, userDetailsStepSchema, EmailStepFormData, UserDetailsStepFormData } from '@/lib/schemas';
import { generateSubdomain, isValidSubdomain, isReservedSubdomain } from '@/lib/subdomainUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TwoStepSignupFormProps {
  onSwitchToLogin: () => void;
}

export const TwoStepSignupForm = ({ onSwitchToLogin }: TwoStepSignupFormProps) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Form for step 1 (email)
  const emailForm = useForm<EmailStepFormData>({
    resolver: zodResolver(emailStepSchema),
    defaultValues: { email: '' },
  });

  // Form for step 2 (user details)
  const userDetailsForm = useForm<UserDetailsStepFormData>({
    resolver: zodResolver(userDetailsStepSchema),
    defaultValues: { fullName: '', password: '' },
  });

  // Generate company name from user name
  const generateCompanyName = (fullName: string): string => {
    const firstName = fullName.split(' ')[0];
    return `${firstName}'s Comunidade`;
  };

  const checkSubdomainAvailability = async (subdomain: string): Promise<boolean> => {
    const { data } = await supabase
      .from('companies')
      .select('id')
      .eq('subdomain', subdomain)
      .maybeSingle();
    
    return !data; // Returns true if subdomain is available
  };

  const onEmailSubmit = async (data: EmailStepFormData) => {
    setIsLoading(true);
    
    try {
      // Check if email already exists
      const { data: existingUser } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: 'dummy-password' // This will fail but tell us if user exists
      });
      
      if (existingUser?.user) {
        toast({
          title: "Email já cadastrado",
          description: "Este email já possui uma conta. Faça login ou use outro email.",
          variant: "destructive",
        });
        return;
      }
    } catch (error: any) {
      // If error is not "Invalid login credentials", it means user might exist
      if (!error.message?.includes('Invalid login credentials')) {
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao verificar o email. Tente novamente.",
          variant: "destructive",
        });
        return;
      }
    }
    
    setEmail(data.email);
    setCurrentStep(2);
    setIsLoading(false);
  };

  const onUserDetailsSubmit = async (data: UserDetailsStepFormData) => {
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: data.fullName,
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Falha ao criar usuário');
      }

      const userId = authData.user.id;
      const companyName = generateCompanyName(data.fullName);
      
      // Generate and validate subdomain
      let subdomain = generateSubdomain(companyName);
      
      // Check if it's reserved
      if (isReservedSubdomain(subdomain)) {
        subdomain = `${subdomain}-comunidade`;
      }
      
      // Ensure it's valid
      if (!isValidSubdomain(subdomain)) {
        throw new Error('Nome não é válido para gerar subdomínio');
      }
      
      // Check availability and add counter if needed
      let isAvailable = await checkSubdomainAvailability(subdomain);
      let counter = 1;
      
      while (!isAvailable) {
        subdomain = `${generateSubdomain(companyName)}-${counter}`;
        isAvailable = await checkSubdomainAvailability(subdomain);
        counter++;
      }

      // 2. Create company with auto-generated name and subdomain
      const { data: companyData, error: companyError } = await (supabase as any)
        .from('companies')
        .insert({
          name: companyName,
          slug: subdomain,
          status: 'active',
          plan: 'free'
        })
        .select()
        .single();

      if (companyError) throw companyError;

      const companyId = companyData.id;

      // 3. Create user profile
      const nameParts = data.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || firstName;

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          company_id: companyId,
          first_name: firstName,
          last_name: lastName,
          role: 'owner'
        });

      if (profileError) throw profileError;

      // 4. Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          company_id: companyId,
          role: 'owner'
        });

      if (roleError) throw roleError;

      toast({
        title: "Conta criada com sucesso!",
        description: `Bem-vindo ao ${companyName}! Acesse: ${subdomain}.seudominio.com`,
      });

    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro ao criar sua conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
        <CardDescription>
          {currentStep === 1 ? 'Digite seu email para começar' : 'Complete suas informações'}
        </CardDescription>
        <div className="flex justify-center mt-4">
          <div className="flex space-x-2">
            <div className={`w-8 h-2 rounded-full ${currentStep >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-8 h-2 rounded-full ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {currentStep === 1 ? (
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Verificando...' : 'Continuar'}
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...userDetailsForm}>
            <form onSubmit={userDetailsForm.handleSubmit(onUserDetailsSubmit)} className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="p-0 h-auto"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span>{email}</span>
              </div>

              <FormField
                control={userDetailsForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder="João Silva"
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={userDetailsForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Criando conta...' : 'Criar Conta'}
              </Button>
            </form>
          </Form>
        )}

        <div className="text-center">
          <Button
            type="button"
            variant="link"
            onClick={onSwitchToLogin}
            className="text-sm"
          >
            Já tem uma conta? Faça login
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};