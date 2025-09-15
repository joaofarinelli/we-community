import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useEventParticipants } from "@/hooks/useEventParticipants";
import { useAuth } from "@/hooks/useAuth";
import { useEventPayment } from "@/hooks/useEventPayment";
import { useCoinName } from "@/hooks/useCoinName";

interface EventParticipationDropdownProps {
  eventId: string;
  isPaid?: boolean;
  priceCoins?: number;
  eventTitle?: string;
}

export const EventParticipationDropdown = ({ 
  eventId, 
  isPaid = false, 
  priceCoins = 0, 
  eventTitle = "este evento" 
}: EventParticipationDropdownProps) => {
  const { user } = useAuth();
  const { participants, joinEvent, leaveEvent } = useEventParticipants(eventId);
  const { processPayment, refundPayment, userCoins } = useEventPayment();
  const { data: coinName } = useCoinName();
  
  const userParticipation = participants?.find(p => p.user_id === user?.id);
  const currentStatus = userParticipation ? 'confirmed' : 'not_confirmed';

  const handleStatusChange = async (value: string) => {
    if (value === 'confirmed' && !userParticipation) {
      if (isPaid && priceCoins > 0) {
        // Check if user has enough coins
        if (userCoins < priceCoins) {
          alert(`Você precisa de ${priceCoins} ${coinName || 'moedas'} para participar deste evento. Saldo atual: ${userCoins} ${coinName || 'moedas'}.`);
          return;
        }
        
        // Process payment first
        try {
          await processPayment.mutateAsync({
            eventId,
            priceCoins,
            eventTitle,
          });
          
          // Then join the event
          joinEvent.mutate();
        } catch (error) {
          console.error('Payment failed:', error);
        }
      } else {
        // Free event, just join
        joinEvent.mutate();
      }
    } else if (value === 'not_confirmed' && userParticipation) {
      // Leave the event
      leaveEvent.mutate();
      
      // If it was a paid event, process refund
      if (isPaid && priceCoins > 0) {
        await refundPayment.mutateAsync({
          eventId,
          priceCoins,
          eventTitle,
        });
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Status de Participação</label>
        {isPaid && priceCoins > 0 && (
          <Badge variant="secondary" className="text-xs">
            {priceCoins} {coinName || 'moedas'}
          </Badge>
        )}
      </div>
      <Select 
        value={currentStatus} 
        onValueChange={handleStatusChange}
        disabled={joinEvent.isPending || leaveEvent.isPending || processPayment.isPending || refundPayment.isPending}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="not_confirmed">Não confirmado</SelectItem>
          <SelectItem value="confirmed">
            {isPaid && priceCoins > 0 ? `Confirmar (${priceCoins} ${coinName || 'moedas'})` : 'Confirmado'}
          </SelectItem>
        </SelectContent>
      </Select>
      
      {isPaid && priceCoins > 0 && userCoins < priceCoins && (
        <p className="text-xs text-destructive">
          Saldo insuficiente. Você precisa de {priceCoins - userCoins} {coinName || 'moedas'} a mais.
        </p>
      )}
    </div>
  );
};