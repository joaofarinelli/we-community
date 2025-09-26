import { Calendar, MapPin, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUpcomingEvents } from '@/hooks/useUpcomingEvents';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface UpcomingEventsCardProps {
  spaceId: string;
}

export const UpcomingEventsCard = ({ spaceId }: UpcomingEventsCardProps) => {
  const { data: upcomingEvents, isLoading } = useUpcomingEvents(spaceId);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Próximos Eventos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!upcomingEvents || upcomingEvents.length === 0) {
    return null; // Don't show card if no upcoming events
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Próximos Eventos</span>
          <Badge variant="secondary">{upcomingEvents.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {upcomingEvents.map((event) => {
            const startDate = new Date(event.start_date);
            const participantCount = event.event_participants?.length || 0;
            
            return (
              <div
                key={event.id}
                className="p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/dashboard/events/${event.id}`)}
              >
                <div className="space-y-2">
                  <h4 className="font-medium text-sm leading-tight line-clamp-2">
                    {event.title}
                  </h4>
                  
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {format(startDate, "dd MMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{participantCount} participante{participantCount !== 1 ? 's' : ''}</span>
                    </div>
                    
                    {event.payment_required && (
                      <Badge variant="outline" className="text-xs">
                        {event.price_coins} moedas
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {upcomingEvents.length === 5 && (
          <div className="p-4 text-center border-t">
            <button
              onClick={() => navigate('/dashboard/calendar')}
              className="text-xs text-primary hover:underline"
            >
              Ver todos os eventos
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};