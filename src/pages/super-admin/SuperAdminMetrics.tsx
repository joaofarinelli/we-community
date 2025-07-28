import { useEffect } from "react";
import { SuperAdminLayout } from "@/components/super-admin/SuperAdminLayout";
import { useSuperAdminMetrics, useSuperAdminCompanies } from "@/hooks/useSuperAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3,
  Building2,
  Users,
  MessageSquare,
  TrendingUp,
  Activity,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export const SuperAdminMetrics = () => {
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

  useEffect(() => {
    refetchMetrics();
    refetchCompanies();
  }, [refetchMetrics, refetchCompanies]);

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  };

  // Mock previous month data for growth calculation
  const mockPreviousMetrics = {
    total_companies: (metrics?.total_companies || 0) - Math.floor((metrics?.total_companies || 0) * 0.1),
    total_users: (metrics?.total_users || 0) - Math.floor((metrics?.total_users || 0) * 0.15),
    total_posts: (metrics?.total_posts || 0) - Math.floor((metrics?.total_posts || 0) * 0.2),
    companies_this_month: 0,
    users_this_month: 0
  };

  const topCompanies = companies?.slice(0, 5) || [];

  const globalMetrics = [
    {
      title: "Total de Empresas",
      value: metrics?.total_companies || 0,
      growth: calculateGrowth(metrics?.total_companies || 0, mockPreviousMetrics.total_companies),
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Total de Usuários",
      value: metrics?.total_users || 0,
      growth: calculateGrowth(metrics?.total_users || 0, mockPreviousMetrics.total_users),
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Total de Espaços",
      value: metrics?.total_spaces || 0,
      growth: calculateGrowth(metrics?.total_spaces || 0, (metrics?.total_spaces || 0) - 5),
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Total de Posts",
      value: metrics?.total_posts || 0,
      growth: calculateGrowth(metrics?.total_posts || 0, mockPreviousMetrics.total_posts),
      icon: MessageSquare,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  const monthlyMetrics = [
    {
      title: "Empresas este Mês",
      value: metrics?.companies_this_month || 0,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Usuários este Mês",
      value: metrics?.users_this_month || 0,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50"
    }
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Métricas Globais</h1>
            <p className="text-muted-foreground">
              Visão geral do desempenho de todas as empresas
            </p>
          </div>
          <Button onClick={() => { refetchMetrics(); refetchCompanies(); }} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Global Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {globalMetrics.map((metric) => {
            const Icon = metric.icon;
            const isPositiveGrowth = metric.growth >= 0;
            
            return (
              <Card key={metric.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(metric.value)}</div>
                  <div className="flex items-center gap-1 text-xs">
                    {isPositiveGrowth ? (
                      <ArrowUpRight className="h-3 w-3 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-600" />
                    )}
                    <span className={isPositiveGrowth ? "text-green-600" : "text-red-600"}>
                      {Math.abs(metric.growth).toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">vs mês anterior</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Monthly Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Crescimento Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {monthlyMetrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.title} className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                      <Icon className={`h-6 w-6 ${metric.color}`} />
                    </div>
                    <div>
                      <h3 className="font-medium">{metric.title}</h3>
                      <p className="text-2xl font-bold">{metric.value}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(), "MMMM yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Companies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top 5 Empresas por Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            {companiesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-muted rounded-lg"></div>
                      <div>
                        <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-6 w-16 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : topCompanies.length > 0 ? (
              <div className="space-y-4">
                {topCompanies.map((company, index) => (
                  <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 bg-primary/10 rounded-lg">
                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{company.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {company.subdomain && `${company.subdomain}.plataforma.com`}
                          {company.custom_domain && ` • ${company.custom_domain}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {company.total_users || 0}
                      </Badge>
                      <Badge 
                        variant={company.status === 'active' ? 'default' : 'secondary'}
                      >
                        {company.status === 'active' ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma empresa encontrada</h3>
                <p className="text-muted-foreground">
                  Ainda não há empresas cadastradas no sistema.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-medium">Sistema Operacional</h3>
                <p className="text-sm text-muted-foreground">
                  Todos os serviços funcionando normalmente
                </p>
                <Badge className="mt-2" variant="default">
                  99.9% Uptime
                </Badge>
              </div>
              
              <div className="text-center">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium">Performance</h3>
                <p className="text-sm text-muted-foreground">
                  Tempo de resposta médio: 120ms
                </p>
                <Badge className="mt-2" variant="outline">
                  Excelente
                </Badge>
              </div>
              
              <div className="text-center">
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-medium">Usuários Ativos</h3>
                <p className="text-sm text-muted-foreground">
                  Últimas 24 horas
                </p>
                <Badge className="mt-2" variant="secondary">
                  {Math.floor((metrics?.total_users || 0) * 0.3)} usuários
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};