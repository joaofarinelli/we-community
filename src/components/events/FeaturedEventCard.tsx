import { useState } from 'react';
import { Calendar, MapPin, Users, Clock, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEventParticipants } from '@/hooks/useEventParticipants';
import { useAuth } from '@/hooks/useAuth';
import { useCanEditEvent } from '@/hooks/useCanEditEvent';
import { useDeleteEvent } from '@/hooks/useDeleteEvent';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EditEventDialog } from './EditEventDialog';

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
  };
  onEventClick?: (eventId: string) => void;
}

export const FeaturedEventCard = ({ event, onEventClick }: FeaturedEventCardProps) => {
  const { user } = useAuth();
  const { participants, joinEvent, leaveEvent, isJoining, isLeaving } = useEventParticipants(event.id);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const canEdit = useCanEditEvent({ space_id: event.space_id, created_by: event.created_by, status: event.status });
  const deleteEvent = useDeleteEvent();
  
  const isParticipant = participants.some(p => p.user_id === user?.id);
  const participantCount = participants.length;
  const hasMaxParticipants = event.max_participants && participantCount >= event.max_participants;

  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);

  const handleParticipationToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isParticipant) {
      leaveEvent.mutate();
    } else {
      joinEvent.mutate();
    }
  };

  const handleDeleteEvent = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      deleteEvent.mutate(event.id);
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow border-2 border-primary/20"
      onClick={() => onEventClick?.(event.id)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Próximo Evento
          </Badge>
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

        <div className="flex gap-6">
          {event.image_url && (
            <div className="flex-shrink-0">
              <img 
                src={event.image_url} 
                alt={event.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
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
                disabled={isJoining || isLeaving || (!isParticipant && hasMaxParticipants)}
              >
                {isJoining || isLeaving
                  ? "..."
                  : isParticipant
                  ? "Confirmado"
                  : hasMaxParticipants
                  ? "Lotado"
                  : "Confirmar presença"
                }
              </Button>
            </div>
          </div>
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
    </Card>
  );
};