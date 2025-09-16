import { useState } from 'react';
import { Calendar, MapPin, Users, Clock, MoreHorizontal, Edit, Trash2, Heart, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEventParticipants } from '@/hooks/useEventParticipants';
import { useEventLikes } from '@/hooks/useEventLikes';
import { useEventComments } from '@/hooks/useEventComments';
import { useAuth } from '@/hooks/useAuth';
import { useCanEditEvent } from '@/hooks/useCanEditEvent';
import { useDeleteEvent } from '@/hooks/useDeleteEvent';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EditEventDialog } from './EditEventDialog';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
  location?: string;
  location_type?: string;
  location_address?: string;
  online_link?: string;
    max_participants?: number;
    image_url?: string;
    status: 'draft' | 'active';
    space_id: string;
    created_by: string;
    event_participants?: any[];
  };
  onEventClick?: (eventId: string) => void;
}

export const EventCard = ({ event, onEventClick }: EventCardProps) => {
  const { user } = useAuth();
  const { participants, joinEvent, leaveEvent, isJoining, isLeaving } = useEventParticipants(event.id);
  const { userLike, likesCount, toggleLike } = useEventLikes(event.id);
  const { data: comments = [] } = useEventComments(event.id);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const canEdit = useCanEditEvent({ space_id: event.space_id, created_by: event.created_by, status: event.status });
  const deleteEvent = useDeleteEvent();
  
  const isParticipant = participants.some(p => p.user_id === user?.id);
  const participantCount = participants.length;
  const hasMaxParticipants = event.max_participants && participantCount >= event.max_participants;
  const totalComments = comments.reduce((acc, comment) => acc + 1 + (comment.replies?.length || 0), 0);

  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const isToday = format(startDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isSameDay = format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');

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
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => {
        if (editDialogOpen) return;
        window.location.href = `/dashboard/events/${event.id}`;
      }}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {event.image_url && (
            <div className="flex-shrink-0">
              <img 
                src={event.image_url} 
                alt={event.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold truncate">{event.title}</h3>
              <div className="flex items-center gap-2 ml-2">
                {isToday && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                    Hoje
                  </Badge>
                )}
                {event.status === 'draft' && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                    Rascunho
                  </Badge>
                )}
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
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(startDate, "d 'de' MMMM", { locale: ptBR })}
                  {!isSameDay && ` - ${format(endDate, "d 'de' MMMM", { locale: ptBR })}`}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}</span>
              </div>

              {event.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
            </div>

            {event.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                {event.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {participantCount}{event.max_participants && `/${event.max_participants}`}
                  </span>
                </div>
                
                <div className="flex -space-x-1">
                  {participants.slice(0, 3).map((participant, index) => (
                    <Avatar key={participant.id} className="h-6 w-6 border-2 border-background">
                      <AvatarFallback className="text-xs">
                        {(participant as any).profiles?.first_name?.[0] || 'U'}
                        {(participant as any).profiles?.last_name?.[0] || ''}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {participants.length > 3 && (
                    <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">+{participants.length - 3}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Likes and Comments */}
                <div className="flex items-center gap-3 mr-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike.mutate();
                    }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Heart className={`h-3 w-3 ${userLike ? 'fill-current text-red-500' : ''}`} />
                    {likesCount > 0 && <span>{likesCount}</span>}
                  </button>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircle className="h-3 w-3" />
                    {totalComments > 0 && <span>{totalComments}</span>}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={isParticipant ? "outline" : "default"}
                  onClick={handleParticipationToggle}
                  disabled={isJoining || isLeaving || (!isParticipant && hasMaxParticipants)}
                  className="text-xs"
                >
                  {isJoining || isLeaving
                    ? "..."
                    : isParticipant
                    ? "Confirmado"
                    : hasMaxParticipants
                    ? "Lotado"
                    : "Confirmar"
                  }
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <EditEventDialog 
        event={event}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </Card>
  );
};