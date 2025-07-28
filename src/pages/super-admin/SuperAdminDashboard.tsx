import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SuperAdminLayout } from "@/components/super-admin/SuperAdminLayout";
import { useSuperAdminMetrics, useSuperAdminCompanies } from "@/hooks/useSuperAdmin";
import { Building2, Users, MessageSquare, TrendingUp, Calendar, Activity } from "lucide-react";

export const SuperAdminDashboard = () => {
  const { 
    data: metrics, 
    isLoading: metricsLoading, 
    refetch: refetchMetrics 
  } = useSuperAdminMetrics();
  
  const { 
    data: companies, 
    isLoading: companiesLoading, 
    refetch: refetchCompanies 
  } = useSuperAdminCompanies();

  // Enable queries when component mounts
  useEffect(() => {
    refetchMetrics();
    refetchCompanies();
  }, [refetchMetrics, refetchCompanies]);

  if (metricsLoading || companiesLoading) {
    return (
      <SuperAdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Dashboard Global</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  const metricCards = [
    {
      title: "Total de Empresas",
      value: metrics?.total_companies || 0,
      icon: Building2,
      description: `${metrics?.active_companies || 0} ativas`
    },
    {
      title: "Total de Usuários",
      value: metrics?.total_users || 0,
      icon: Users,
      description: "Usuários ativos"
    },
    {
      title: "Total de Espaços",
      value: metrics?.total_spaces || 0,
      icon: Activity,
      description: "Em todas as empresas"
    },
    {
      title: "Total de Posts",
      value: metrics?.total_posts || 0,
      icon: MessageSquare,
      description: "Conteúdo gerado"
    },
    {
      title: "Empresas Este Mês",
      value: metrics?.companies_this_month || 0,
      icon: Calendar,
      description: "Novas empresas"
    },
    {
      title: "Usuários Este Mês",
      value: metrics?.users_this_month || 0,
      icon: TrendingUp,
      description: "Novos usuários"
    }
  ];

  const recentCompanies = companies?.slice(0, 5) || [];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Global</h1>
          <p className="text-muted-foreground">
            Visão geral de todas as empresas e métricas do SAAS
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metricCards.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Companies */}
        <Card>
          <CardHeader>
            <CardTitle>Empresas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCompanies.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{company.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {company.subdomain && `${company.subdomain}.`}
                      {company.custom_domain || 'lovable.app'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {company.total_users} usuários
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {company.status === 'active' ? 'Ativa' : 'Inativa'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};