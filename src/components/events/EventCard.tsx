import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useEventParticipants } from '@/hooks/useEventParticipants';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    location?: string;
    max_participants?: number;
    image_url?: string;
    event_participants?: any[];
  };
  onEventClick?: (eventId: string) => void;
}

export const EventCard = ({ event, onEventClick }: EventCardProps) => {
  const { user } = useAuth();
  const { participants, joinEvent, leaveEvent, isJoining, isLeaving } = useEventParticipants(event.id);
  
  const isParticipant = participants.some(p => p.user_id === user?.id);
  const participantCount = participants.length;
  const hasMaxParticipants = event.max_participants && participantCount >= event.max_participants;

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

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onEventClick?.(event.id)}
    >
      {event.image_url && (
        <div className="h-48 w-full overflow-hidden rounded-t-lg">
          <img 
            src={event.image_url} 
            alt={event.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">{event.title}</h3>
          {isToday && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Hoje
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {format(startDate, "d 'de' MMMM", { locale: ptBR })}
            {!isSameDay && ` - ${format(endDate, "d 'de' MMMM", { locale: ptBR })}`}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
          </span>
        </div>

        {event.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {event.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {participantCount} participante{participantCount !== 1 ? 's' : ''}
              {event.max_participants && ` / ${event.max_participants}`}
            </span>
            
            {participants.slice(0, 3).map((participant, index) => (
              <Avatar key={participant.id} className="h-6 w-6 -ml-1">
                <AvatarFallback className="text-xs">
                  {(participant as any).profiles?.first_name?.[0] || 'U'}
                  {(participant as any).profiles?.last_name?.[0] || ''}
                </AvatarFallback>
              </Avatar>
            ))}
            
            {participants.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{participants.length - 3}
              </div>
            )}
          </div>

          <Button
            size="sm"
            variant={isParticipant ? "outline" : "default"}
            onClick={handleParticipationToggle}
            disabled={isJoining || isLeaving || (!isParticipant && hasMaxParticipants)}
          >
            {isJoining || isLeaving
              ? "..."
              : isParticipant
              ? "Sair"
              : hasMaxParticipants
              ? "Lotado"
              : "Participar"
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};