import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Play,
  Eye,
  Calendar
} from 'lucide-react';
import { useBulkActionExecutions, useBulkActionResults } from '@/hooks/useBulkActionsNew';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pendente',
    color: 'bg-yellow-100 text-yellow-800',
  },
  running: {
    icon: Play,
    label: 'Executando',
    color: 'bg-blue-100 text-blue-800',
  },
  completed: {
    icon: CheckCircle,
    label: 'Concluído',
    color: 'bg-green-100 text-green-800',
  },
  failed: {
    icon: XCircle,
    label: 'Falhou',
    color: 'bg-red-100 text-red-800',
  },
};

export function BulkActionExecutionsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);

  const { data: executions = [], isLoading } = useBulkActionExecutions(id);
  const { data: results = [] } = useBulkActionResults(selectedExecutionId || undefined);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/bulk-actions')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Histórico de Execuções</h1>
            <p className="text-muted-foreground">
              Visualize o histórico de execuções e resultados da ação em massa.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Execuções ({executions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {executions.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma execução encontrada</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {executions.map((execution) => {
                      const config = statusConfig[execution.status];
                      const Icon = config.icon;
                      const successRate = execution.total_targets > 0 
                        ? Math.round((execution.success_count / execution.total_targets) * 100)
                        : 0;

                      return (
                        <div
                          key={execution.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-accent ${
                            selectedExecutionId === execution.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setSelectedExecutionId(execution.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded ${config.color}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <Badge variant="outline" className={config.color}>
                                {config.label}
                              </Badge>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total:</span>
                              <span>{execution.total_targets} usuários</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Processados:</span>
                              <span>{execution.processed_count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-600">Sucesso:</span>
                              <span className="text-green-600">{execution.success_count}</span>
                            </div>
                            {execution.error_count > 0 && (
                              <div className="flex justify-between">
                                <span className="text-red-600">Erros:</span>
                                <span className="text-red-600">{execution.error_count}</span>
                              </div>
                            )}
                            {execution.status === 'completed' && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Taxa de sucesso:</span>
                                <span className={successRate >= 90 ? 'text-green-600' : successRate >= 70 ? 'text-yellow-600' : 'text-red-600'}>
                                  {successRate}%
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(execution.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </div>

                          {execution.error_message && (
                            <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                              {execution.error_message}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Execução</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedExecutionId ? (
                <ScrollArea className="h-96">
                  {results.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <div className="text-center">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Carregando resultados...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {results.map((result: any) => (
                        <div key={result.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-sm font-medium">
                                {result.profiles.first_name} {result.profiles.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {result.profiles.email}
                              </p>
                            </div>
                            <Badge 
                              variant={result.status === 'success' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {result.status === 'success' ? 'Sucesso' : 'Erro'}
                            </Badge>
                          </div>

                          {result.error_message && (
                            <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                              {result.error_message}
                            </div>
                          )}

                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <Clock className="h-3 w-3" />
                            {format(new Date(result.processed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="text-center">
                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Selecione uma execução para ver os detalhes</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}