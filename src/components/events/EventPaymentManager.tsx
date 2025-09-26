import { useState } from 'react';
import { Check, X, Clock, ExternalLink, Eye, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useEventParticipants } from '@/hooks/useEventParticipants';
import { useEventPayment } from '@/hooks/useEventPayment';
import { UserAvatar } from '@/components/dashboard/UserAvatar';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EventPaymentManagerProps {
  eventId: string;
  eventTitle: string;
  priceCoins?: number;
}

export const EventPaymentManager = ({ eventId, eventTitle, priceCoins = 0 }: EventPaymentManagerProps) => {
  const { participants } = useEventParticipants(eventId);
  const { approvePayment, cancelPayment } = useEventPayment();
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Filter participants with pending payments
  const pendingPayments = participants.filter(p => 
    p.payment_status === 'pending_external' || p.payment_status === 'pending_coins'
  );

  const approvedPayments = participants.filter(p => 
    p.payment_status === 'approved'
  );

  const getParticipantName = (participant: any) => {
    if (participant.profiles?.first_name && participant.profiles?.last_name) {
      return `${participant.profiles.first_name} ${participant.profiles.last_name}`;
    }
    return 'Usuário';
  };

  const handleApprovePayment = async (participant: any) => {
    try {
      await approvePayment.mutateAsync({
        participantId: participant.user_id,
        eventId,
        paymentMethod: participant.payment_method || 'external',
        priceCoins: participant.payment_method === 'coins' ? priceCoins : undefined,
      });
      toast.success(`Pagamento de ${getParticipantName(participant)} aprovado!`);
    } catch (error) {
      toast.error('Erro ao aprovar pagamento');
    }
  };

  const handleRejectPayment = async (participant: any) => {
    if (!confirm(`Tem certeza que deseja rejeitar o pagamento de ${getParticipantName(participant)}? Eles serão removidos do evento.`)) {
      return;
    }

    try {
      await cancelPayment.mutateAsync({
        participantId: participant.user_id,
        eventId,
        paymentMethod: participant.payment_method || 'external',
      });
      toast.success(`Pagamento de ${getParticipantName(participant)} rejeitado`);
    } catch (error) {
      toast.error('Erro ao rejeitar pagamento');
    }
  };

  const showParticipantDetails = (participant: any) => {
    setSelectedParticipant(participant);
    setShowDetailsDialog(true);
  };

  const getPaymentMethodBadge = (paymentMethod: string) => {
    switch (paymentMethod) {
      case 'coins':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Moedas</Badge>;
      case 'external':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Link Externo</Badge>;
      default:
        return <Badge variant="outline">Não definido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Payments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pagamentos Pendentes ({pendingPayments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum pagamento pendente
            </p>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 border-yellow-200"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={getParticipantName(participant)}
                      size="sm"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{getParticipantName(participant)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getPaymentMethodBadge(participant.payment_method)}
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Aguardando Aprovação
                        </Badge>
                        {participant.payment_requested_at && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(participant.payment_requested_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => showParticipantDetails(participant)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprovePayment(participant)}
                      disabled={approvePayment.isPending}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectPayment(participant)}
                      disabled={cancelPayment.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approved Payments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Pagamentos Aprovados ({approvedPayments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvedPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum pagamento aprovado ainda
            </p>
          ) : (
            <div className="space-y-3">
              {approvedPayments.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={getParticipantName(participant)}
                      size="sm"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{getParticipantName(participant)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getPaymentMethodBadge(participant.payment_method)}
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Pago
                        </Badge>
                        {participant.payment_approved_at && (
                          <span className="text-xs text-muted-foreground">
                            Aprovado em {format(new Date(participant.payment_approved_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participant Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Pagamento</DialogTitle>
            <DialogDescription>
              Informações sobre a solicitação de pagamento
            </DialogDescription>
          </DialogHeader>
          
          {selectedParticipant && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={getParticipantName(selectedParticipant)}
                  size="md"
                />
                <div>
                  <p className="font-medium">{getParticipantName(selectedParticipant)}</p>
                  <p className="text-sm text-muted-foreground">Participante do evento</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Evento:</label>
                  <p className="text-sm text-muted-foreground">{eventTitle}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Método de Pagamento:</label>
                  <div className="mt-1">
                    {getPaymentMethodBadge(selectedParticipant.payment_method)}
                  </div>
                </div>

                {priceCoins > 0 && (
                  <div>
                    <label className="text-sm font-medium">Valor:</label>
                    <p className="text-sm text-muted-foreground">{priceCoins} moedas</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Status:</label>
                  <div className="mt-1">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Aguardando Aprovação
                    </Badge>
                  </div>
                </div>

                {selectedParticipant.payment_requested_at && (
                  <div>
                    <label className="text-sm font-medium">Solicitado em:</label>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedParticipant.payment_requested_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    handleApprovePayment(selectedParticipant);
                    setShowDetailsDialog(false);
                  }}
                  disabled={approvePayment.isPending}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Aprovar Pagamento
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleRejectPayment(selectedParticipant);
                    setShowDetailsDialog(false);
                  }}
                  disabled={cancelPayment.isPending}
                  className="flex-1 text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};