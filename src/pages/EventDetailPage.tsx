import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Link as LinkIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEventDetails } from '@/hooks/useEventDetails';
import { useEventParticipants } from '@/hooks/useEventParticipants';
import { EventBanner } from '@/components/events/EventBanner';
import { EventLikeButton } from '@/components/events/EventLikeButton';
import { EventParticipationDropdown } from '@/components/events/EventParticipationDropdown';
import { EventInteractions } from '@/components/events/EventInteractions';
import { EventMaterialsSection } from '@/components/events/EventMaterialsSection';
import { UserAvatar } from '@/components/dashboard/UserAvatar';

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading } = useEventDetails(eventId!);
  const { participants } = useEventParticipants(eventId!);

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!event) {
    return <div className="p-6">Evento não encontrado</div>;
  }

  const isToday = new Date(event.start_date).toDateString() === new Date().toDateString();
  const isPast = new Date(event.end_date) < new Date();

  const generateCalendarFile = () => {
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Your Company//Your App//EN
BEGIN:VEVENT
UID:${event.id}@yourapp.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || ''}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getLocationIcon = () => {
    switch (event.location_type) {
      case 'online': return <LinkIcon className="h-4 w-4" />;
      case 'presencial': return <MapPin className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getLocationText = () => {
    switch (event.location_type) {
      case 'online': return event.online_link ? 'Online' : 'Online';
      case 'presencial': return event.location_address || event.location || 'Local presencial';
      default: return event.location || 'Local indefinido';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        {/* Banner */}
        <EventBanner imageUrl={event.image_url} title={event.title} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Title and Badges */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {isToday && (
                  <Badge variant="default">Hoje</Badge>
                )}
                {event.status === 'draft' && (
                  <Badge variant="secondary">Rascunho</Badge>
                )}
                {isPast && (
                  <Badge variant="outline">Finalizado</Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold">{event.title}</h1>
            </div>

            {/* Event Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Informações do Evento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(event.start_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {getLocationIcon()}
                    <span className="text-muted-foreground">{getLocationText()}</span>
                  </div>
                </div>
                
                {event.online_link && event.location_type === 'online' && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(event.online_link, '_blank')}
                      className="gap-2"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Acessar Link Online
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            {event.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {event.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Event Materials */}
            <EventMaterialsSection event={{
              id: event.id,
              space_id: event.space_id,
              created_by: event.created_by,
              status: event.status
            }} />

            {/* Actions and Interactions */}
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateCalendarFile}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Adicionar ao Calendário
                </Button>
              </div>

              <Card>
                <CardContent className="p-6">
                  <EventInteractions eventId={event.id} />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participation Card */}
            <Card>
              <CardHeader>
                <CardTitle>Participação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <EventParticipationDropdown eventId={event.id} />
                
                {event.max_participants && (
                  <div className="text-sm text-muted-foreground">
                    Limite: {participants?.length || 0}/{event.max_participants} participantes
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Participants */}
            {participants && participants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participantes ({participants.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {participants.slice(0, 10).map((participant) => (
                      <div key={participant.id} className="flex items-center gap-3">
                        <UserAvatar 
                          name="Participante"
                          size="sm" 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            Participante
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {participant.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {participants.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        +{participants.length - 10} participantes
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}