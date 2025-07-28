import { useEffect } from "react";
import { SuperAdminLayout } from "@/components/super-admin/SuperAdminLayout";
import { CompanyReportCard } from "@/components/super-admin/CompanyReportCard";
import { useSuperAdminCompanies } from "@/hooks/useSuperAdmin";
import { useGeneratedReports, useCreateReport } from "@/hooks/useGeneratedReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3, 
  Users, 
  Building2,
  RefreshCw,
  Loader2
} from "lucide-react";

export const SuperAdminReports = () => {
  const { 
    data: companies, 
    isLoading, 
    refetch 
  } = useSuperAdminCompanies();

  const { 
    data: generatedReports, 
    isLoading: reportsLoading, 
    refetch: refetchReports 
  } = useGeneratedReports();

  const { createReport } = useCreateReport();
  const { toast } = useToast();

  // Enable the query when component mounts
  useEffect(() => {
    refetch();
    refetchReports();
  }, [refetch, refetchReports]);

  const handleGenerateReport = async (reportType: string, title: string) => {
    try {
      await createReport({
        name: title,
        type: reportType,
        description: `Relatório gerado automaticamente em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
      });

      toast({
        title: "Relatório sendo gerado",
        description: "O relatório será processado e estará disponível em breve.",
      });

      // Refetch reports to show the new generating report
      refetchReports();
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description: "Houve um problema ao iniciar a geração do relatório.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getReportTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'global-activity': 'Atividades Globais',
      'companies-growth': 'Crescimento',
      'user-engagement': 'Engajamento',
      'financial-summary': 'Financeiro'
    };
    return typeMap[type] || type;
  };
  const reportTypes = [
    {
      id: "global-activity",
      title: "Relatório Global de Atividades",
      description: "Atividades de todas as empresas nos últimos 30 dias",
      icon: BarChart3,
      status: "available"
    },
    {
      id: "companies-growth",
      title: "Crescimento de Empresas",
      description: "Análise de crescimento e retenção de empresas",
      icon: Building2,
      status: "available"
    },
    {
      id: "user-engagement",
      title: "Engajamento de Usuários",
      description: "Métricas de engajamento por empresa",
      icon: Users,
      status: "available"
    },
    {
      id: "financial-summary",
      title: "Resumo Financeiro",
      description: "Relatório financeiro consolidado",
      icon: FileText,
      status: "coming-soon"
    }
  ];


  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Centro de Relatórios</h1>
            <p className="text-muted-foreground">
              Relatórios em tempo real de todas as empresas do sistema
            </p>
          </div>
          <Button onClick={() => { refetch(); refetchReports(); }} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar Todos
          </Button>
        </div>

        {/* Real-time Company Reports */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <div key={j} className="h-12 bg-muted rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : companies && companies.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Relatórios por Empresa</h2>
              <Badge variant="outline" className="gap-2">
                <Building2 className="h-4 w-4" />
                {companies.length} empresa{companies.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {companies.map((company) => (
                <CompanyReportCard
                  key={company.id}
                  companyId={company.id}
                  companyName={company.name}
                />
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma empresa encontrada</h3>
              <p className="text-muted-foreground text-center">
                Não há empresas cadastradas no sistema para gerar relatórios.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Generate Reports Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {report.description}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={report.status === 'available' ? 'default' : 'secondary'}
                    >
                      {report.status === 'available' ? 'Disponível' : 'Em Breve'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full gap-2" 
                    disabled={report.status !== 'available'}
                    onClick={() => handleGenerateReport(report.id, report.title)}
                  >
                    <FileText className="h-4 w-4" />
                    Gerar Relatório
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Relatórios Recentes
              {reportsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <div className="h-4 w-4 bg-muted-foreground/20 rounded"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-muted rounded w-48 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-64"></div>
                      </div>
                    </div>
                    <div className="h-8 w-20 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : generatedReports && generatedReports.length > 0 ? (
              <div className="space-y-4">
                {generatedReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        {report.status === 'generating' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{report.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {getReportTypeLabel(report.type)} • {formatFileSize(report.file_size)} • 
                          Gerado em {format(new Date(report.generated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        {report.status === 'generating' && (
                          <Badge variant="secondary" className="mt-1">Processando...</Badge>
                        )}
                        {report.status === 'failed' && (
                          <Badge variant="destructive" className="mt-1">Falha na geração</Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      disabled={report.status !== 'generated'}
                    >
                      <Download className="h-4 w-4" />
                      Baixar
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum relatório encontrado</h3>
                <p className="text-muted-foreground">
                  Gere um relatório para visualizá-lo aqui.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custom Report Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Relatório Personalizado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure um relatório personalizado selecionando métricas específicas 
                e período de análise.
              </p>
              <Button variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Configurar Relatório Personalizado
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};