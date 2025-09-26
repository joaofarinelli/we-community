import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useEventParticipants } from "@/hooks/useEventParticipants";
import { useEventPayment } from "@/hooks/useEventPayment";
import { useCoinName } from "@/hooks/useCoinName";
import { useCanLeaveEvent } from "@/hooks/useCanLeaveEvent";
import { toast } from "sonner";
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
    space_id: string;
    created_by: string;
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
  const { participants, joinEvent, leaveEvent, isJoining, isLeaving } = useEventParticipants(eventId);
  const { userCoins, processPayment, refundPayment } = useEventPayment();
  const coinName = useCoinName();
  
  const currentParticipation = participants.find(p => p.user_id === user?.id);
  const canLeave = useCanLeaveEvent(event, currentParticipation);
  const isParticipating = !!currentParticipation;
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  const handleStatusChange = async (value: string) => {
    if (value === "confirmed") {
      if (isPaid && priceCoins && userCoins < priceCoins) {
        setShowPurchaseDialog(true);
        return;
      }
      
      await joinEvent.mutateAsync({
        eventId,
        paymentStatus: isPaid ? 'pending_coins' : 'none',
        paymentMethod: isPaid ? 'coins' : undefined,
      });
    } else if (value === "unconfirmed") {
      if (!canLeave) {
        toast.error('Você não pode sair do evento após se confirmar ou fazer o pagamento. Entre em contato com um administrador.');
        return;
      }
      
      // Handle refund if user had paid
      if (currentParticipation?.payment_status === 'approved') {
        try {
          await refundPayment.mutateAsync({
            eventId,
            participantId: user!.id,
            paymentMethod: 'coins',
            priceCoins: priceCoins || 0,
          });
        } catch (error) {
          console.error('Refund failed:', error);
          toast.error('Erro ao processar reembolso');
          return;
        }
      }
      
      await leaveEvent.mutateAsync({});
    }
  };

  const handlePurchaseSuccess = () => {
    setShowPurchaseDialog(false);
  };

  const currentStatus = isParticipating ? "confirmed" : "unconfirmed";

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Status de Participação</label>
          {isPaid && priceCoins && (
            <Badge variant="secondary" className="text-xs">
              {priceCoins} {coinName.data}
            </Badge>
          )}
        </div>
        
        <Select value={currentStatus} onValueChange={handleStatusChange} disabled={isJoining || isLeaving}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="confirmed">
              Confirmado
              {isPaid && priceCoins && (
                <span className="ml-2 text-xs opacity-70">
                  ({priceCoins} {coinName.data})
                </span>
              )}
            </SelectItem>
            <SelectItem 
              value="unconfirmed" 
              disabled={!canLeave}
              className={!canLeave ? "opacity-50 cursor-not-allowed" : ""}
            >
              Não confirmado
              {!canLeave && isParticipating && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (Bloqueado)
                </span>
              )}
            </SelectItem>
          </SelectContent>
        </Select>
        
        {!canLeave && isParticipating && (
          <p className="text-xs text-muted-foreground mt-1">
            Você não pode sair após se confirmar ou pagar. Contate um administrador.
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