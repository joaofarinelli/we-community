import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompany } from '@/hooks/useCompany';
import { ThemeConfiguration } from '@/components/admin/ThemeConfiguration';
import { PageBannerSection } from '@/components/admin/PageBannerSection';
import { CompanyLogoSection } from '@/components/admin/CompanyLogoSection';
import { CustomDomainSection } from '@/components/admin/CustomDomainSection';
import { FeedBannerSection } from '@/components/admin/FeedBannerSection';
import { LoginBannerSection } from '@/components/admin/LoginBannerSection';
import { CoinNameSection } from '@/components/admin/CoinNameSection';
import { CourseBannerSection } from '@/components/courses/CourseBannerSection';
import { CompanyFaviconSection } from '@/components/admin/CompanyFaviconSection';
import { CourseProgressionSection } from '@/components/admin/CourseProgressionSection';
import { LessonPlayerBannerSection } from '@/components/admin/LessonPlayerBannerSection';

export const AdminSettingsPage = () => {
  const { data: company } = useCompany();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações da Empresa</h1>
          <p className="text-muted-foreground">
            Configure as informações e personalização da sua empresa
          </p>
        </div>

        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="personalizacao">Personalização</TabsTrigger>
            <TabsTrigger value="avancado">Avançado</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-6 mt-6">
            <div className="grid gap-6">
              <CompanyLogoSection />
              <CompanyFaviconSection />
              
              <Card>
                <CardHeader>
                  <CardTitle>Informações Gerais</CardTitle>
                  <CardDescription>
                    Configure o nome e descrição da sua empresa
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Nome da Empresa</Label>
                    <Input
                      id="company-name"
                      placeholder="Nome da sua empresa"
                      defaultValue={company?.name}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-description">Descrição</Label>
                    <Textarea
                      id="company-description"
                      placeholder="Descreva sua empresa..."
                    />
                  </div>
                  <Button>Salvar Alterações</Button>
                </CardContent>
              </Card>

              <CoinNameSection />

              <CourseProgressionSection />

              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Gamificação</CardTitle>
                  <CardDescription>
                    Configure os níveis e pontuação da sua comunidade
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Gerenciar Níveis de Gamificação
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="personalizacao" className="space-y-6 mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cores e Tema</CardTitle>
                  <CardDescription>
                    Configure as cores e aparência da sua plataforma
                  </CardDescription>
                </CardHeader>
              </Card>
              <ThemeConfiguration />
              
              <Card>
                <CardHeader>
                  <CardTitle>Banners das Páginas</CardTitle>
                  <CardDescription>
                    Configure os banners que aparecem nas diferentes páginas da plataforma
                  </CardDescription>
                </CardHeader>
              </Card>

              <FeedBannerSection />
              <LoginBannerSection />
              
              <Card>
                <CardHeader>
                  <CardTitle>Banner da Página de Cursos</CardTitle>
                  <CardDescription>
                    Configure o banner que aparecerá na página de cursos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CourseBannerSection isAdminMode={true} />
                </CardContent>
              </Card>
              <PageBannerSection 
                bannerType="trails" 
                title="Banner da Página de Trilhas" 
                description="Configure o banner que aparecerá na página de trilhas" 
              />
              <PageBannerSection 
                bannerType="members" 
                title="Banner da Página de Membros" 
                description="Configure o banner que aparecerá na página de membros" 
              />
              <PageBannerSection 
                bannerType="ranking" 
                title="Banner da Página de Ranking" 
                description="Configure o banner que aparecerá na página de ranking" 
              />
              <PageBannerSection 
                bannerType="marketplace" 
                title="Banner da Página de Marketplace" 
                description="Configure o banner que aparecerá na página de marketplace" 
              />
              <PageBannerSection 
                bannerType="store" 
                title="Banner da Página de Loja" 
                description="Configure o banner que aparecerá na página de loja" 
              />
              <PageBannerSection 
                bannerType="bank" 
                title="Banner da Página de Banco" 
                description="Configure o banner que aparecerá na página de banco" 
              />
              <PageBannerSection 
                bannerType="challenges" 
                title="Banner da Página de Desafios" 
                description="Configure o banner que aparecerá na página de desafios" 
              />
              <PageBannerSection 
                bannerType="spaces" 
                title="Banner da Página de Espaços" 
                description="Configure o banner que aparecerá na página de espaços" 
              />
              
              <LessonPlayerBannerSection />
            </div>
          </TabsContent>

          <TabsContent value="avancado" className="space-y-6 mt-6">
            <div className="grid gap-6">
              <CustomDomainSection />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};