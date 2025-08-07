import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { locale: ptBR });
  const gridEnd = endOfWeek(monthEnd, { locale: ptBR });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const getEventsForDate = (date: Date) =>
    events.filter((e) => isSameDay(new Date(e.start_date), date));

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-px mb-2 text-xs text-muted-foreground">
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
          const dayEvents = getEventsForDate(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(isSelected ? null : day)}
              className={cn(
                'min-h-[120px] p-2 text-left rounded-md border transition-colors',
                'hover:bg-accent',
                !inMonth && 'opacity-60',
                isSelected && 'bg-primary text-primary-foreground',
                isToday && !isSelected && 'bg-accent border-primary'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{format(day, 'd')}</span>
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs px-2 py-1 rounded bg-primary/10 text-primary truncate"
                    title={event.title}
                    aria-label={`Evento: ${event.title}`}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[11px] text-muted-foreground">+{dayEvents.length - 3} mais</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
