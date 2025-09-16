import { useState, useMemo } from 'react';
import { EventCard } from './EventCard';
import { FeaturedEventCard } from './FeaturedEventCard';
import { EventsFilters } from './EventsFilters';
import { format, isToday, isFuture, isPast } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  max_participants?: number;
  image_url?: string;
  event_participants?: any;
  status?: 'draft' | 'active';
  space_id: string;
  created_by: string;
  // Payment fields
  is_paid?: boolean;
  price_coins?: number;
  payment_required?: boolean;
}

interface EventsListProps {
  events: Event[];
  onEventClick?: (eventId: string) => void;
}

export const EventsList = ({ events, onEventClick }: EventsListProps) => {
  const [activeFilter, setActiveFilter] = useState<'hoje' | 'futuros' | 'passados' | 'rascunhos'>('hoje');

  const { filteredEvents, featuredEvent, counts } = useMemo(() => {
    const now = new Date();
    
    // Filter out draft events from general tabs (only show in drafts tab)
    const activeEvents = events.filter(event => event.status !== 'draft');
    const draftEvents = events.filter(event => event.status === 'draft');
    
    const todayEvents = activeEvents.filter(event => isToday(new Date(event.start_date)));
    const futureEvents = activeEvents.filter(event => isFuture(new Date(event.start_date)) && !isToday(new Date(event.start_date)));
    const pastEvents = activeEvents.filter(event => isPast(new Date(event.end_date)));

    const counts = {
      hoje: todayEvents.length,
      futuros: futureEvents.length,
      passados: pastEvents.length,
      rascunhos: draftEvents.length,
    };

    let filteredEvents: Event[] = [];
    switch (activeFilter) {
      case 'hoje':
        filteredEvents = todayEvents;
        break;
      case 'futuros':
        filteredEvents = futureEvents;
        break;
      case 'passados':
        filteredEvents = pastEvents;
        break;
      case 'rascunhos':
        filteredEvents = draftEvents;
        break;
    }

    // Featured event is the next upcoming event (only active events)
    const featuredEvent = futureEvents.length > 0 ? futureEvents[0] : todayEvents[0] || null;

    return { filteredEvents, featuredEvent, counts };
  }, [events, activeFilter]);

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📅</div>
        <h3 className="text-lg font-semibold mb-2">Nenhum evento encontrado</h3>
        <p className="text-muted-foreground">
          Ainda não há eventos neste espaço. Crie o primeiro evento!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EventsFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={counts}
      />

      {featuredEvent && activeFilter === 'futuros' && (
        <div className="mb-6">
          <FeaturedEventCard event={featuredEvent} onEventClick={onEventClick} />
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-2xl mb-2">
            {activeFilter === 'hoje' && '🗓️'}
            {activeFilter === 'futuros' && '⏭️'}
            {activeFilter === 'passados' && '📋'}
            {activeFilter === 'rascunhos' && '✏️'}
          </div>
          <p className="text-muted-foreground">
            {activeFilter === 'hoje' && 'Nenhum evento programado para hoje'}
            {activeFilter === 'futuros' && 'Nenhum evento futuro programado'}
            {activeFilter === 'passados' && 'Nenhum evento passado encontrado'}
            {activeFilter === 'rascunhos' && 'Nenhum rascunho de evento'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents
            .filter(event => activeFilter !== 'futuros' || event.id !== featuredEvent?.id)
            .map((event) => (
              <EventCard
                key={event.id}
                event={event as any}
                onEventClick={onEventClick}
              />
            ))}
        </div>
      )}
    </div>
  );
};