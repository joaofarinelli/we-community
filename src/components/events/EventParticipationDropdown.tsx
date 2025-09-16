import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useEventParticipants } from "@/hooks/useEventParticipants";
import { useAuth } from "@/hooks/useAuth";
import { useEventPayment } from "@/hooks/useEventPayment";
import { useCoinName } from "@/hooks/useCoinName";
import { PurchaseEventDialog } from "./PurchaseEventDialog";

interface EventParticipationDropdownProps {
  eventId: string;
  isPaid?: boolean;
  priceCoins?: number;
  eventTitle?: string;
  event?: {
    id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    location?: string;
    price_coins?: number;
    max_participants?: number;
  };
}

export const EventParticipationDropdown = ({ 
  eventId, 
  isPaid = false, 
  priceCoins = 0, 
  eventTitle = "este evento",
  event
}: EventParticipationDropdownProps) => {
  const { user } = useAuth();
  const { participants, joinEvent, leaveEvent } = useEventParticipants(eventId);
  const { processPayment, refundPayment, userCoins } = useEventPayment();
  const { data: coinName } = useCoinName();
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  
  const userParticipation = participants?.find(p => p.user_id === user?.id);
  const currentStatus = userParticipation ? 'confirmed' : 'not_confirmed';

  const handleStatusChange = async (value: string) => {
    if (value === 'confirmed' && !userParticipation) {
      if (isPaid && priceCoins > 0 && event) {
        // Open purchase dialog for paid events
        setShowPurchaseDialog(true);
        return;
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

  const handlePurchaseSuccess = () => {
    setShowPurchaseDialog(false);
    // The PurchaseEventDialog already handles joining the event
  };

  return (
    <>
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

      {event && (
        <PurchaseEventDialog
          open={showPurchaseDialog}
          onOpenChange={setShowPurchaseDialog}
          event={event}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </>
  );
};