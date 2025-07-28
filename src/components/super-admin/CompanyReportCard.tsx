import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCompanyReport } from "@/hooks/useSuperAdminReports";
import { 
  Users, 
  MessageSquare, 
  BookOpen, 
  ShoppingCart, 
  Coins, 
  TrendingUp,
  Download,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CompanyReportCardProps {
  companyId: string;
  companyName: string;
}

export const CompanyReportCard = ({ companyId, companyName }: CompanyReportCardProps) => {
  const { data: report, isLoading, error, refetch } = useCompanyReport(companyId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {companyName}
            <div className="animate-pulse h-4 w-20 bg-muted rounded"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !report) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">{companyName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Erro ao carregar relatório da empresa
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      icon: Users,
      label: "Usuários",
      value: `${report.users_active}/${report.users_total}`,
      description: "Ativos/Total",
      progress: report.users_total > 0 ? (report.users_active / report.users_total) * 100 : 0
    },
    {
      icon: MessageSquare,
      label: "Posts",
      value: report.posts_total.toString(),
      description: `${report.posts_this_month} este mês`,
      color: "text-blue-600"
    },
    {
      icon: BookOpen,
      label: "Lições",
      value: report.lesson_completions.toString(),
      description: "Completadas",
      color: "text-green-600"
    },
    {
      icon: ShoppingCart,
      label: "Compras",
      value: report.marketplace_purchases.toString(),
      description: "Marketplace",
      color: "text-purple-600"
    },
    {
      icon: Coins,
      label: "Moedas",
      value: report.total_coins_earned.toLocaleString(),
      description: "Total ganhas",
      color: "text-yellow-600"
    },
    {
      icon: TrendingUp,
      label: "Engajamento",
      value: report.user_engagement_score.toString(),
      description: "Score de 0-100",
      color: report.user_engagement_score > 70 ? "text-green-600" : 
             report.user_engagement_score > 40 ? "text-yellow-600" : "text-red-600"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{companyName}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {report.spaces_total} espaços
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Última atividade: {
            report.last_activity !== 'N/A' 
              ? format(new Date(report.last_activity), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
              : 'Nenhuma atividade'
          }
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${metric.color || 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <div>
                  <div className="text-xl font-bold">{metric.value}</div>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                  {'progress' in metric && (
                    <Progress value={metric.progress} className="h-1 mt-1" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Atualizado automaticamente a cada minuto
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Baixar Relatório
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};