import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportBugDialog } from '@/components/dashboard/ReportBugDialog';
import { useBugReports } from '@/hooks/useBugReports';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bug, Plus } from 'lucide-react';

const getCategoryLabel = (category: string) => {
  const categories = {
    bug: 'Bug / Erro',
    feature: 'Solicitação de funcionalidade',
    performance: 'Problema de performance',
    ui: 'Problema de interface',
    accessibility: 'Acessibilidade',
    other: 'Outro'
  };
  return categories[category as keyof typeof categories] || category;
};

const getPriorityLabel = (priority: string) => {
  const priorities = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    critical: 'Crítica'
  };
  return priorities[priority as keyof typeof priorities] || priority;
};

const getStatusLabel = (status: string) => {
  const statuses = {
    open: 'Aberto',
    in_progress: 'Em andamento',
    resolved: 'Resolvido',
    closed: 'Fechado'
  };
  return statuses[status as keyof typeof statuses] || status;
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'open':
      return 'destructive';
    case 'in_progress':
      return 'default';
    case 'resolved':
      return 'secondary';
    case 'closed':
      return 'outline';
    default:
      return 'default';
  }
};

export const BugReportsPage = () => {
  const { bugReports, isLoading } = useBugReports();
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bug className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Meus Relatórios</h1>
        </div>
        <Button onClick={() => setReportDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Relatório
        </Button>
      </div>

      {!bugReports || bugReports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bug className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              Nenhum relatório encontrado
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Você ainda não enviou nenhum relatório de problema.
            </p>
            <Button onClick={() => setReportDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Relatório
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bugReports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg mb-2">{report.title}</CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">
                        {getCategoryLabel(report.category)}
                      </Badge>
                      <Badge variant="outline">
                        {getPriorityLabel(report.priority)}
                      </Badge>
                      <Badge variant={getStatusVariant(report.status)}>
                        {getStatusLabel(report.status)}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(report.created_at), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {report.description}
                </p>
                {report.url && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">
                      Página: {report.url}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ReportBugDialog 
        open={reportDialogOpen} 
        onOpenChange={setReportDialogOpen} 
      />
    </div>
  );
};