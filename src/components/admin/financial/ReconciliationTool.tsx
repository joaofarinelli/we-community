import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePaymentReconciliation } from '@/hooks/usePaymentReconciliation';
import { RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export const ReconciliationTool = () => {
  const [isReconciling, setIsReconciling] = useState(false);
  const { data: reconciliation, isLoading, refetch } = usePaymentReconciliation();

  const handleReconciliation = async () => {
    setIsReconciling(true);
    try {
      await refetch();
      toast.success('Reconciliação executada com sucesso');
    } catch (error) {
      toast.error('Erro ao executar reconciliação');
    } finally {
      setIsReconciling(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'divergent':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'reconciled':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      divergent: 'destructive',
      reconciled: 'default',
      pending: 'secondary',
    };
    
    const labels: Record<string, string> = {
      divergent: 'Divergente',
      reconciled: 'Reconciliado',
      pending: 'Pendente',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Resumo da Reconciliação */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pagamentos Pendentes
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {reconciliation?.summary?.pending || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando confirmação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Divergências
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {reconciliation?.summary?.divergent || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reconciliados
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {reconciliation?.summary?.reconciled || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Última sincronização
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Controles de Reconciliação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={handleReconciliation}
              disabled={isReconciling || isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isReconciling ? 'animate-spin' : ''}`} />
              {isReconciling ? 'Sincronizando...' : 'Sincronizar com TMB'}
            </Button>
            
            <Button variant="outline" onClick={() => refetch()}>
              Atualizar Lista
            </Button>
          </div>

          {reconciliation?.lastSync && (
            <p className="text-sm text-muted-foreground mt-2">
              Última sincronização: {format(new Date(reconciliation.lastSync), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Alertas */}
      {reconciliation?.summary?.divergent > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Foram encontradas {reconciliation.summary.divergent} divergências que requerem sua atenção.
            Verifique os pagamentos listados abaixo.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Pagamentos para Reconciliação</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reconciliation?.payments?.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.reconciliationStatus)}
                        {getStatusBadge(payment.reconciliationStatus)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{payment.id.slice(-8)}</code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.payer_name}</div>
                        <div className="text-sm text-muted-foreground">{payment.user_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      R$ {(payment.amount_cents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {payment.reconciliationNotes || '-'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};