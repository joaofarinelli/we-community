import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, MoreHorizontal, Edit, Trash2, Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ResponsiveBanner } from '@/components/ui/responsive-banner';
import { useEventParticipants } from '@/hooks/useEventParticipants';
import { useAuth } from '@/hooks/useAuth';
import { useCanEditEvent } from '@/hooks/useCanEditEvent';
import { useDeleteEvent } from '@/hooks/useDeleteEvent';
import { useEventPayment } from '@/hooks/useEventPayment';
import { useCoinName } from '@/hooks/useCoinName';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EditEventDialog } from './EditEventDialog';
import { PurchaseEventDialog } from './PurchaseEventDialog';

interface FeaturedEventCardProps {
  event: {
    id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    location?: string;
    max_participants?: number;
    image_url?: string;
    status?: 'draft' | 'active';
    space_id: string;
    created_by: string;
    event_participants?: any[];
    // Payment fields
    is_paid?: boolean;
    price_coins?: number;
    payment_required?: boolean;
  };
  onEventClick?: (eventId: string) => void;
}

export const FeaturedEventCard = ({ event, onEventClick }: FeaturedEventCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { participants, joinEvent, leaveEvent, isJoining, isLeaving } = useEventParticipants(event.id);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const canEdit = useCanEditEvent({ space_id: event.space_id, created_by: event.created_by, status: event.status });
  const deleteEvent = useDeleteEvent();
  const { userCoins } = useEventPayment();
  const { data: coinName } = useCoinName();
  
  const isParticipant = participants.some(p => p.user_id === user?.id);
  const participantCount = participants.length;
  const hasMaxParticipants = event.max_participants && participantCount >= event.max_participants;
  const isPaidEvent = event.is_paid && (event.price_coins || 0) > 0;
  const hasInsufficientBalance = isPaidEvent && userCoins < (event.price_coins || 0);

  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);

  const handleParticipationToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If it's a paid event and user is not a participant, open purchase dialog
    if (isPaidEvent && !isParticipant) {
      setPurchaseDialogOpen(true);
      return;
    }
    
    // Handle free events or leaving paid events
    if (isParticipant) {
      leaveEvent.mutate({});
    } else {
      joinEvent.mutate({});
    }
  };

  const handlePurchaseSuccess = () => {
    // The participants will automatically refresh when the payment succeeds
    // through the existing query invalidation in useEventPayment
  };

  const handleDeleteEvent = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      deleteEvent.mutate(event.id);
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow border-2 border-primary/20 overflow-hidden"
      onClick={(e) => {
        // Check if click originated from dialog portal (outside this component's DOM)
        if (!(e.currentTarget as HTMLElement).contains(e.target as Node)) return;
        if (editDialogOpen || purchaseDialogOpen) return;
        navigate(`/dashboard/events/${event.id}`);
      }}
    >
      {event.image_url && (
        <ResponsiveBanner
          src={event.image_url}
          aspectRatio={3250/750}
          fitMode="contain"
          adaptiveHeight={true}
        />
      )}
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Próximo Evento
            </Badge>
            {isPaidEvent && (
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                <Coins className="h-3 w-3 mr-1" />
                {event.price_coins} {coinName}
              </Badge>
            )}
          </div>
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setEditDialogOpen(true);
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar evento
                </DropdownMenuItem>
                <DropdownMenuItem>Compartilhar</DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={handleDeleteEvent}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{format(startDate, "d 'de' MMMM", { locale: ptBR })}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}</span>
          </div>

          {event.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>

        {event.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {participantCount} participante{participantCount !== 1 ? 's' : ''}
                {event.max_participants && ` / ${event.max_participants}`}
              </span>
            </div>
            
            <div className="flex -space-x-2">
              {participants.slice(0, 4).map((participant, index) => (
                <Avatar key={participant.id} className="h-8 w-8 border-2 border-background">
                  <AvatarFallback className="text-xs">
                    {(participant as any).profiles?.first_name?.[0] || 'U'}
                    {(participant as any).profiles?.last_name?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
              ))}
              {participants.length > 4 && (
                <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">+{participants.length - 4}</span>
                </div>
              )}
            </div>
          </div>

          <Button
            variant={isParticipant ? "outline" : "default"}
            onClick={handleParticipationToggle}
            disabled={isJoining || isLeaving || (!isParticipant && hasMaxParticipants) || (!isParticipant && isPaidEvent && hasInsufficientBalance)}
            className={isPaidEvent && !isParticipant ? "bg-accent hover:bg-accent/90" : ""}
          >
            {isJoining || isLeaving
              ? "..."
              : isParticipant
              ? "Confirmado"
              : hasMaxParticipants
              ? "Lotado"
              : isPaidEvent
              ? hasInsufficientBalance
                ? "Saldo insuficiente"
                : "Participar"
              : "Confirmar presença"
            }
          </Button>
        </div>
      </CardContent>

      <EditEventDialog 
        event={{
          ...event,
          status: event.status || 'active'
        } as any}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <PurchaseEventDialog
        open={purchaseDialogOpen}
        onOpenChange={setPurchaseDialogOpen}
        event={event}
        onSuccess={handlePurchaseSuccess}
      />
    </Card>
  );
};