import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Coins, ExternalLink, Calendar, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEventParticipants } from '@/hooks/useEventParticipants';
import { useEventPayment } from '@/hooks/useEventPayment';
import { useCoinName } from '@/hooks/useCoinName';
import { toast } from 'sonner';

interface EventPaymentManagementProps {
  eventId: string;
  priceCoins?: number;
}

interface Participant {
  id: string;
  user_id: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  payment_requested_at?: string;
  payment_approved_at?: string;
  external_payment_data?: any;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const EventPaymentManagement = ({ eventId, priceCoins }: EventPaymentManagementProps) => {
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const { data: participants, isLoading } = useEventParticipants(eventId);
  const { approvePayment, cancelPayment, refundPayment } = useEventPayment();
  const { data: coinName } = useCoinName();

  const handleApprovePayment = async (participantId: string, paymentMethod: string) => {
    try {
      await approvePayment.mutateAsync({
        participantId,
        eventId,
        paymentMethod,
        priceCoins: priceCoins || 0,
      });
      toast.success('Pagamento aprovado com sucesso!');
      setSelectedParticipant(null);
    } catch (error) {
      console.error('Erro ao aprovar pagamento:', error);
      toast.error('Erro ao aprovar pagamento');
    }
  };

  const handleCancelPayment = async (participantId: string, paymentMethod: string) => {
    try {
      await cancelPayment.mutateAsync({
        participantId,
        eventId,
        paymentMethod,
      });
      toast.success('Pagamento cancelado');
      setSelectedParticipant(null);
    } catch (error) {
      console.error('Erro ao cancelar pagamento:', error);
      toast.error('Erro ao cancelar pagamento');
    }
  };

  const handleRefundPayment = async (participantId: string, paymentMethod: string) => {
    try {
      await refundPayment.mutateAsync({
        participantId,
        eventId,
        paymentMethod,
        priceCoins: priceCoins || 0,
      });
      toast.success('Pagamento reembolsado com sucesso!');
      setSelectedParticipant(null);
    } catch (error) {
      console.error('Erro ao reembolsar pagamento:', error);
      toast.error('Erro ao reembolsar pagamento');
    }
  };

  const getStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'none':
        return <Badge variant="secondary">Gratuito</Badge>;
      case 'pending_coins':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">
          <Clock className="w-3 h-3 mr-1" />
          Pendente - Moedas
        </Badge>;
      case 'pending_external':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">
          <Clock className="w-3 h-3 mr-1" />
          Pendente - Externo
        </Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Aprovado
        </Badge>;
      case 'cancelled':
        return <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Cancelado
        </Badge>;
      default:
        return <Badge variant="secondary">{paymentStatus}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'coins':
        return <Coins className="w-4 h-4" />;
      case 'external':
        return <ExternalLink className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Carregando participantes...</div>;
  }

  const pendingPayments = participants?.filter(p => 
    p.payment_status === 'pending_coins' || p.payment_status === 'pending_external'
  ) || [];

  const allParticipants = participants || [];

  return (
    <div className="space-y-6">
      {pendingPayments.length > 0 && (
        <div>
          <h4 className="font-medium text-orange-600 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pagamentos Pendentes ({pendingPayments.length})
          </h4>
          <div className="border border-orange-200 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participante</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Solicitado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments.map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {participant.profiles.first_name} {participant.profiles.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {participant.profiles.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(participant.payment_method)}
                        <span className="capitalize">
                          {participant.payment_method === 'coins' ? coinName : 'Externo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {participant.payment_requested_at ? (
                        <span className="text-sm">
                          {format(new Date(participant.payment_requested_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprovePayment(participant.id, participant.payment_method!)}
                          disabled={approvePayment.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelPayment(participant.id, participant.payment_method!)}
                          disabled={cancelPayment.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div>
        <h4 className="font-medium mb-3">
          Todos os Participantes ({allParticipants.length})
        </h4>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participante</TableHead>
                <TableHead>Status do Pagamento</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allParticipants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {participant.profiles.first_name} {participant.profiles.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {participant.profiles.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(participant.payment_status)}
                  </TableCell>
                  <TableCell>
                    {participant.payment_method && (
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(participant.payment_method)}
                        <span className="capitalize">
                          {participant.payment_method === 'coins' ? coinName : 'Externo'}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {participant.payment_approved_at ? (
                      <span className="text-sm">
                        {format(new Date(participant.payment_approved_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    ) : participant.payment_requested_at ? (
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(participant.payment_requested_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedParticipant(participant)}
                      >
                        Detalhes
                      </Button>
                      {participant.payment_status === 'approved' && participant.payment_method === 'coins' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRefundPayment(participant.id, participant.payment_method!)}
                          disabled={refundPayment.isPending}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Reembolsar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedParticipant && (
        <Dialog open={!!selectedParticipant} onOpenChange={() => setSelectedParticipant(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Participante</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Informações Pessoais</h4>
                <p><strong>Nome:</strong> {selectedParticipant.profiles.first_name} {selectedParticipant.profiles.last_name}</p>
                <p><strong>E-mail:</strong> {selectedParticipant.profiles.email}</p>
              </div>
              
              <div>
                <h4 className="font-medium">Status do Pagamento</h4>
                <div className="mt-2">
                  {getStatusBadge(selectedParticipant.payment_status)}
                </div>
                {selectedParticipant.payment_method && (
                  <p className="mt-2">
                    <strong>Método:</strong> {selectedParticipant.payment_method === 'coins' ? coinName : 'Externo'}
                  </p>
                )}
              </div>

              {selectedParticipant.external_payment_data && (
                <div>
                  <h4 className="font-medium">Dados do Pagamento Externo</h4>
                  <pre className="text-sm bg-muted p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(selectedParticipant.external_payment_data, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                {(selectedParticipant.payment_status === 'pending_coins' || selectedParticipant.payment_status === 'pending_external') && (
                  <>
                    <Button
                      onClick={() => handleApprovePayment(selectedParticipant.id, selectedParticipant.payment_method!)}
                      disabled={approvePayment.isPending}
                    >
                      Aprovar Pagamento
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleCancelPayment(selectedParticipant.id, selectedParticipant.payment_method!)}
                      disabled={cancelPayment.isPending}
                    >
                      Cancelar Pagamento
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setSelectedParticipant(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};