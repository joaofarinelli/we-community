import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, ExternalLink, Calendar, MapPin, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEventPayment } from '@/hooks/useEventPayment';
import { useEventParticipants } from '@/hooks/useEventParticipants';
import { useCoinName } from '@/hooks/useCoinName';
import { InsufficientBalanceDialog } from './InsufficientBalanceDialog';

interface EventPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    id: string;
    title: string;
    start_date: string;
    end_date?: string;
    location_type: string;
    location_address?: string;
    online_link?: string;
    description?: string;
    payment_type: string;
    price_coins?: number;
    external_payment_url?: string;
    payment_approval_required: boolean;
  };
  onSuccess?: () => void;
}

export const EventPaymentDialog = ({ open, onOpenChange, event, onSuccess }: EventPaymentDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [insufficientBalanceOpen, setInsufficientBalanceOpen] = useState(false);
  const [coinTopupOpen, setCoinTopupOpen] = useState(false);
  
  const { processPayment, requestExternalPayment, userCoins } = useEventPayment();
  const { joinEvent } = useEventParticipants(event.id);
  const { data: coinName } = useCoinName();

  const handleCoinsPayment = async () => {
    if (!event.price_coins) return;
    
    setIsProcessing(true);
    try {
      if (userCoins < event.price_coins) {
        setInsufficientBalanceOpen(true);
        return;
      }

      await processPayment.mutateAsync({
        eventId: event.id,
        priceCoins: event.price_coins,
        eventTitle: event.title,
      });

      await joinEvent.mutateAsync({
        eventId: event.id,
        paymentStatus: event.payment_approval_required ? 'pending_coins' : 'approved',
        paymentMethod: 'coins',
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExternalPayment = async () => {
    if (!event.external_payment_url) return;
    
    try {
      // Open external payment URL
      window.open(event.external_payment_url, '_blank');
      
      // Register external payment request
      await requestExternalPayment.mutateAsync({
        eventId: event.id,
        eventTitle: event.title,
      });

      await joinEvent.mutateAsync({
        eventId: event.id,
        paymentStatus: 'pending_external',
        paymentMethod: 'external',
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao processar pagamento externo:', error);
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };

  const canPayWithCoins = event.payment_type === 'coins' || event.payment_type === 'both';
  const canPayWithExternal = event.payment_type === 'external' || event.payment_type === 'both';
  const hasInsufficientBalance = canPayWithCoins && event.price_coins && userCoins < event.price_coins;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Pagamento do Evento
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{event.title}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Clock className="w-4 h-4" />
                {formatDateTime(event.start_date)}
                {event.end_date && event.end_date !== event.start_date && 
                  ` - ${formatDateTime(event.end_date)}`
                }
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                {event.location_type === 'online' ? (
                  <><ExternalLink className="w-4 h-4" /> Online</>
                ) : event.location_type === 'presencial' ? (
                  <><MapPin className="w-4 h-4" /> {event.location_address || 'Presencial'}</>
                ) : (
                  <><MapPin className="w-4 h-4" /> Local indefinido</>
                )}
              </div>
            </div>

            {event.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            )}

            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium">Opções de Pagamento</h4>
              
              {canPayWithCoins && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      <span className="font-medium">{coinName || 'WomanCoins'}</span>
                    </div>
                    <Badge variant="secondary">{event.price_coins} moedas</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Seu saldo:</span>
                    <span className={hasInsufficientBalance ? 'text-destructive' : 'text-muted-foreground'}>
                      {userCoins} moedas
                    </span>
                  </div>
                  
                  {hasInsufficientBalance && (
                    <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                      Saldo insuficiente para este evento
                    </div>
                  )}
                  
                  <Button
                    onClick={handleCoinsPayment}
                    disabled={isProcessing || hasInsufficientBalance}
                    className="w-full"
                  >
                    {isProcessing ? 'Processando...' : `Pagar com ${coinName || 'WomanCoins'}`}
                  </Button>
                </div>
              )}
              
              {canPayWithCoins && canPayWithExternal && (
                <div className="border-t pt-4">
                  <div className="text-center text-sm text-muted-foreground">ou</div>
                </div>
              )}
              
              {canPayWithExternal && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    <span className="font-medium">Pagamento Externo</span>
                  </div>
                  
                  <Button
                    onClick={handleExternalPayment}
                    variant="outline"
                    className="w-full"
                  >
                    Acessar Link de Pagamento
                  </Button>
                  
                  {event.payment_approval_required && (
                    <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      <Users className="w-4 h-4 inline mr-1" />
                      Seu pagamento precisará ser aprovado por um administrador
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <InsufficientBalanceDialog
        open={insufficientBalanceOpen}
        onOpenChange={setInsufficientBalanceOpen}
        event={event}
        userCoins={userCoins}
        onOpenCoinTopup={() => {
          setInsufficientBalanceOpen(false);
          setCoinTopupOpen(true);
        }}
      />
    </>
  );
};