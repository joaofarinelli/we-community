import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getEventsForDate, preprocessEvents } from '@/lib/date-utils';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export interface CalendarEvent {
  id: string;
  title: string;
  start_date: string; // ISO
  end_date: string;   // ISO
  spaces?: { name?: string } | null;
  event_participants?: { id: string }[] | null;
}

interface MonthViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  onSelectDate: (d: Date | null) => void;
  events: any[];
}

export const MonthView = ({ currentDate, selectedDate, onSelectDate, events }: MonthViewProps) => {
  const navigate = useNavigate();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { locale: ptBR });
  const gridEnd = endOfWeek(monthEnd, { locale: ptBR });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Pre-processar eventos uma vez para otimizar performance
  const processedEvents = useMemo(() => preprocessEvents(events), [events]);

  // Visual variants for events using design tokens
  const eventVariants = [
    'bg-primary/10 text-primary',
    'bg-accent/10 text-accent-foreground',
    'bg-secondary/10 text-secondary-foreground',
    'bg-destructive/10 text-destructive',
  ];

  console.log('📅 MonthView: Total eventos processados:', processedEvents.length);

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-px mb-2 text-xs text-muted-foreground select-none">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
          <div key={d} className="px-2 py-2 text-center font-medium">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {days.map((day) => {
          const inMonth = day >= monthStart && day <= monthEnd;
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const dayEvents = getEventsForDate(processedEvents, day);
          
          // Debug para cada dia com eventos
          if (dayEvents.length > 0) {
            console.log(`📅 ${format(day, 'dd/MM')}:`, dayEvents.length, 'eventos:', dayEvents.map(e => e.title));
          }

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(isSelected ? null : day)}
              className={cn(
                'min-h-[120px] p-2 text-left rounded-lg border bg-card/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
                'hover:bg-accent/40',
                !inMonth && 'opacity-60',
                isSelected && 'bg-primary/10 border-primary',
                isToday && !isSelected && 'ring-2 ring-primary'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">{format(day, 'd')}</span>
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event, idx) => (
                  <button
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/events/${event.id}`);
                    }}
                    className={cn(
                      'text-xs px-2 py-1 rounded truncate hover-scale animate-fade-in cursor-pointer w-full text-left transition-transform hover:scale-105',
                      eventVariants[idx % eventVariants.length]
                    )}
                    title={event.title}
                    aria-label={`Ver evento: ${event.title}`}
                  >
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[11px] text-muted-foreground/80">+{dayEvents.length - 3} mais</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
