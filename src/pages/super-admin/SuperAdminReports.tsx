import { SuperAdminLayout } from "@/components/super-admin/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3, 
  Users, 
  Building2 
} from "lucide-react";

export const SuperAdminReports = () => {
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

  const recentReports = [
    {
      name: "Relatório Mensal - Janeiro 2025",
      date: "28/01/2025",
      type: "Atividades Globais",
      size: "2.4 MB"
    },
    {
      name: "Crescimento Q4 2024",
      date: "15/01/2025",
      type: "Crescimento",
      size: "1.8 MB"
    },
    {
      name: "Engajamento Dezembro",
      date: "05/01/2025",
      type: "Engajamento",
      size: "3.1 MB"
    }
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Centro de Relatórios</h1>
          <p className="text-muted-foreground">
            Gere e baixe relatórios detalhados sobre todas as empresas
          </p>
        </div>

        {/* Generate Reports */}
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReports.map((report, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium">{report.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {report.type} • {report.size} • Gerado em {report.date}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Baixar
                  </Button>
                </div>
              ))}
            </div>
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