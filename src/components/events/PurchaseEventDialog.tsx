import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Calendar, MapPin, Users, AlertCircle } from 'lucide-react';
import { useEventPayment } from '@/hooks/useEventPayment';
import { useEventParticipants } from '@/hooks/useEventParticipants';
import { useCoinName } from '@/hooks/useCoinName';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PurchaseEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    location?: string;
    price_coins?: number;
    max_participants?: number;
  };
  onSuccess?: () => void;
}

export const PurchaseEventDialog = ({ 
  open, 
  onOpenChange, 
  event, 
  onSuccess 
}: PurchaseEventDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { processPayment, userCoins } = useEventPayment();
  const { joinEvent } = useEventParticipants(event.id);
  const { data: coinName } = useCoinName();
  
  const priceCoins = event.price_coins || 0;
  const hasInsufficientBalance = userCoins < priceCoins;
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);

  const handlePurchase = async () => {
    if (hasInsufficientBalance || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      await processPayment.mutateAsync({
        eventId: event.id,
        priceCoins,
        eventTitle: event.title,
      });

      // Add user as participant after successful payment
      await joinEvent.mutateAsync();
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Comprar presença
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Event Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">{event.title}</h3>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(startDate, "d 'de' MMMM", { locale: ptBR })} - {format(startDate, 'HH:mm')} às {format(endDate, 'HH:mm')}
                </span>
              </div>
              
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
              )}
              
              {event.max_participants && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Máximo de {event.max_participants} participantes</span>
                </div>
              )}
            </div>
            
            {event.description && (
              <p className="text-sm text-muted-foreground mt-3 p-3 bg-muted/50 rounded-md">
                {event.description}
              </p>
            )}
          </div>

          {/* Price and Balance */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="font-medium">Preço do evento:</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold">
                {priceCoins} {coinName}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Seu saldo atual:</span>
              <span className={`font-medium ${hasInsufficientBalance ? 'text-destructive' : 'text-primary'}`}>
                {userCoins} {coinName}
              </span>
            </div>
            
            {hasInsufficientBalance && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Saldo insuficiente</p>
                  <p className="text-destructive/80">
                    Você precisa de mais {priceCoins - userCoins} {coinName} para participar deste evento.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {!hasInsufficientBalance && (
            <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary/20 rounded-md">
              <div className="text-sm">
                <p className="font-medium text-primary">Confirmar compra</p>
                <p className="text-primary/80">
                  Após a compra, {priceCoins} {coinName} será(ão) debitado(s) do seu saldo e você será automaticamente adicionado como participante.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={hasInsufficientBalance || isProcessing}
            className="min-w-[100px]"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Processando...
              </div>
            ) : (
              `Comprar por ${priceCoins} ${coinName}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};