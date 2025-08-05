import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Plus, ExternalLink, Users } from 'lucide-react';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { useSupabaseContext } from '@/hooks/useSupabaseContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

export const CompanySelectionPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { userCompanies, switchToCompany, createProfileForCompany } = useCompanyContext();
  const { toast } = useToast();
  
  // Initialize Supabase context for multi-company users
  useSupabaseContext();

  const handleSwitchCompany = async (companyId: string) => {
    await switchToCompany(companyId);
  };

  const handleCreateProfile = async (companyId: string) => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha seu nome e sobrenome.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      await createProfileForCompany(companyId, firstName.trim(), lastName.trim());
      toast({
        title: "Perfil criado com sucesso!",
        description: "Você agora pode acessar esta empresa.",
      });
      setIsCreateDialogOpen(false);
      setFirstName('');
      setLastName('');
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Erro ao criar perfil",
        description: "Ocorreu um erro ao criar seu perfil nesta empresa.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 shadow-elegant">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-heading mb-2">Selecione uma Empresa</h1>
          <p className="text-muted-foreground">
            Escolha qual empresa você deseja acessar ou crie um novo perfil
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {userCompanies.map((company) => (
            <Card 
              key={company.company_id}
              className="cursor-pointer transition-all duration-200 hover:shadow-elegant hover:scale-[1.02] bg-background/95 backdrop-blur-sm border-0"
              onClick={() => handleSwitchCompany(company.company_id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-sm">
                          {company.company_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {company.company_name}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {company.user_role}
                    </Badge>
                  </div>
                  <ExternalLink className="h-4 w-4 opacity-50" />
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {(company.company_subdomain || company.company_custom_domain) && (
                  <CardDescription className="text-xs mb-3">
                    {company.company_custom_domain || `${company.company_subdomain}.dominio.com`}
                  </CardDescription>
                )}
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  Membro desde {new Date(company.profile_created_at).toLocaleDateString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Create New Profile Card */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer transition-all duration-200 hover:shadow-elegant hover:scale-[1.02] bg-primary/5 border-dashed border-2 border-primary/20 hover:border-primary/40">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg mb-2 text-primary">Nova Empresa</CardTitle>
                  <CardDescription className="text-sm">
                    Crie um perfil em uma nova empresa
                  </CardDescription>
                </CardContent>
              </Card>
            </DialogTrigger>
            
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Criar Perfil em Nova Empresa
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Seu primeiro nome"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Seu sobrenome"
                  />
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Esta funcionalidade será implementada em breve. Por enquanto, você precisa ser convidado por um administrador da empresa.
                </p>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    disabled={true} // Disabled for now
                    className="flex-1"
                  >
                    {isCreating ? "Criando..." : "Criar Perfil"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {userCompanies.length === 0 && (
          <Card className="text-center py-12 bg-background/95 backdrop-blur-sm border-0">
            <CardContent>
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl mb-2">Nenhuma empresa encontrada</CardTitle>
              <CardDescription className="mb-6">
                Você ainda não tem acesso a nenhuma empresa. Entre em contato com um administrador para receber um convite.
              </CardDescription>
              <Button variant="outline">
                Falar com Suporte
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};