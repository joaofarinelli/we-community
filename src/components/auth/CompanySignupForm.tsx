import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { CompanySignupFormData, companySignupSchema } from '@/lib/schemas';
import { generateSubdomain, isValidSubdomain, isReservedSubdomain } from '@/lib/subdomainUtils';
import { Loader2, Building, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface CompanySignupFormProps {
  onSwitchToLogin: () => void;
}

export const CompanySignupForm = ({ onSwitchToLogin }: CompanySignupFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CompanySignupFormData>({
    resolver: zodResolver(companySignupSchema),
    defaultValues: {
      companyName: '',
      cnpj: '',
      companyPhone: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      userPhone: '',
    },
  });

  const checkSubdomainAvailability = async (subdomain: string): Promise<boolean> => {
    const { data } = await supabase
      .from('companies')
      .select('id')
      .eq('subdomain', subdomain)
      .maybeSingle();
    
    return !data; // Returns true if subdomain is available
  };

  const onSubmit = async (data: CompanySignupFormData) => {
    setIsLoading(true);
    
    try {
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          }
        }
      });

      if (authError) {
        toast({
          variant: "destructive",
          title: "Erro no cadastro",
          description: authError.message === 'User already registered' 
            ? 'Este email já está cadastrado' 
            : authError.message,
        });
        return;
      }

      if (!authData.user) {
        toast({
          variant: "destructive",
          title: "Erro no cadastro",
          description: "Não foi possível criar a conta",
        });
        return;
      }

      // 2. Generate and validate subdomain
      let subdomain = generateSubdomain(data.companyName);
      
      // Check if it's reserved
      if (isReservedSubdomain(subdomain)) {
        subdomain = `${subdomain}-empresa`;
      }
      
      // Ensure it's valid
      if (!isValidSubdomain(subdomain)) {
        throw new Error('Nome da empresa não é válido para gerar subdomínio');
      }
      
      // Check availability and add counter if needed
      let isAvailable = await checkSubdomainAvailability(subdomain);
      let counter = 1;
      
      while (!isAvailable) {
        subdomain = `${generateSubdomain(data.companyName)}-${counter}`;
        isAvailable = await checkSubdomainAvailability(subdomain);
        counter++;
      }

      // 3. Create company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([
          {
            name: data.companyName,
            subdomain: subdomain,
            cnpj: data.cnpj || null,
            phone: data.companyPhone || null,
            address: data.address || null,
            city: data.city || null,
            state: data.state || null,
            postal_code: data.postalCode || null,
          }
        ])
        .select()
        .single();

      if (companyError) {
        toast({
          variant: "destructive",
          title: "Erro ao criar empresa",
          description: companyError.message,
        });
        return;
      }

      // 4. Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: authData.user.id,
            company_id: companyData.id,
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.userPhone || null,
            role: 'owner',
          }
        ]);

      if (profileError) {
        toast({
          variant: "destructive",
          title: "Erro ao criar perfil",
          description: profileError.message,
        });
        return;
      }

      // 4. Create user role
      await supabase
        .from('user_roles')
        .insert([
          {
            user_id: authData.user.id,
            company_id: companyData.id,
            role: 'owner',
          }
        ]);

      toast({
        title: "Cadastro realizado!",
        description: `Sua empresa foi criada com sucesso. Bem-vindo ao ${data.companyName}!`,
      });

    } catch (error) {
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
        <h2 className="text-2xl font-bold text-foreground">Cadastrar Empresa</h2>
        <p className="text-muted-foreground">
          Crie sua conta e comece a gerenciar sua comunidade
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Dados da Empresa */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Dados da Empresa</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nome da Empresa *</FormLabel>
                    <FormControl>
                      <Input placeholder="Sua Empresa Ltda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone da Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 9999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="00000-000" 
                          {...field}
                          maxLength={9}
                          onChange={async (e) => {
                            // Format CEP as user types
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 5) {
                              value = value.replace(/^(\d{5})(\d)/, '$1-$2');
                            }
                            field.onChange(value);
                            
                            // Auto-fill address when CEP is complete
                            if (value.replace(/\D/g, '').length === 8) {
                              try {
                                const cleanCep = value.replace(/\D/g, '');
                                const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                                const data = await response.json();
                                
                                if (data && !data.erro) {
                                  form.setValue('address', data.logradouro || '');
                                  form.setValue('city', data.localidade || '');
                                  form.setValue('state', data.uf || '');
                                }
                              } catch (error) {
                                console.error('Erro ao buscar CEP:', error);
                              }
                            }
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, bairro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="São Paulo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="SP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Dados do Usuário */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Seus Dados (Proprietário)</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="João" {...field} />
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
                    <FormLabel>Sobrenome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input placeholder="joao@empresa.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="userPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seu Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Senha *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              'Criar Conta e Empresa'
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-primary hover:underline font-medium"
          >
            Fazer login
          </button>
        </p>
      </div>
    </div>
  );
};