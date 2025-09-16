import { eachDayOfInterval, endOfWeek, format, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getEventsForDate } from '@/lib/date-utils';
import { useNavigate } from 'react-router-dom';


interface WeekViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  onSelectDate: (d: Date | null) => void;
  events: any[];
}

const START_HOUR = 7;
const END_HOUR = 23; // exclusive label
const MINUTE_HEIGHT = 1; // 1px per minute for clarity
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
const GRID_HEIGHT = TOTAL_MINUTES * MINUTE_HEIGHT; // px

function minutesSinceStart(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes();
  return (h - START_HOUR) * 60 + m;
}

function calculateEventLayout(events: any[], eventIndex: number) {
  const currentEvent = events[eventIndex];
  const currentStart = minutesSinceStart(new Date(currentEvent.start_date));
  const currentEnd = minutesSinceStart(new Date(currentEvent.end_date));
  
  // Find all events that overlap with the current event
  const overlappingEvents = events.filter((event, idx) => {
    if (idx === eventIndex) return true;
    const start = minutesSinceStart(new Date(event.start_date));
    const end = minutesSinceStart(new Date(event.end_date));
    return Math.max(currentStart, start) < Math.min(currentEnd, end);
  });
  
  // Sort overlapping events by start time, then by index for consistency
  overlappingEvents.sort((a, b) => {
    const aStart = minutesSinceStart(new Date(a.start_date));
    const bStart = minutesSinceStart(new Date(b.start_date));
    if (aStart !== bStart) return aStart - bStart;
    return events.indexOf(a) - events.indexOf(b);
  });
  
  const totalColumns = overlappingEvents.length;
  const currentColumn = overlappingEvents.findIndex(e => e.id === currentEvent.id);
  
  const columnWidth = 100 / totalColumns;
  const left = (currentColumn * columnWidth);
  
  return {
    left: `${left}%`,
    width: `${columnWidth}%`,
    zIndex: currentColumn
  };
}

export const WeekView = ({ currentDate, selectedDate, onSelectDate, events }: WeekViewProps) => {
  const navigate = useNavigate();
  const start = startOfWeek(currentDate, { locale: ptBR });
  const end = endOfWeek(currentDate, { locale: ptBR });
  const days = eachDayOfInterval({ start, end });

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  const eventVariants = [
    'bg-primary/10 text-primary',
    'bg-accent/10 text-accent-foreground',
    'bg-secondary/10 text-secondary-foreground',
    'bg-destructive/10 text-destructive',
  ];

  return (
    <div className="w-full overflow-auto">
      <div className="flex rounded-lg border bg-card">
        {/* Time column */}
        <div className="sticky left-0 z-10 w-16 border-r bg-background/80 backdrop-blur">
          <div className="relative" style={{ height: GRID_HEIGHT }}>
            {hours.map((h) => (
              <div key={h} className="absolute w-full -translate-y-1/2 pr-2 text-right text-xs text-muted-foreground" style={{ top: (h - START_HOUR) * 60 * MINUTE_HEIGHT }}>
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>
        </div>

        {/* Days grid */}
        <div className="grid flex-1 grid-cols-7">
          {days.map((day) => {
            const dayEvents = getEventsForDate(events, day)
              .sort((a, b) => {
                const aStart = a._parsedStartDate || new Date(a.start_date);
                const bStart = b._parsedStartDate || new Date(b.start_date);
                return aStart.getTime() - bStart.getTime();
              });

            return (
              <div key={day.toISOString()} className="relative border-l first:border-l-0" style={{ height: GRID_HEIGHT }}>
                {/* Hour lines */}
                {hours.map((h) => (
                  <div key={h} className="absolute left-0 right-0 border-t border-dashed" style={{ top: (h - START_HOUR) * 60 * MINUTE_HEIGHT }} />
                ))}

                {/* Day header */}
                <button
                  onClick={() => onSelectDate(selectedDate && selectedDate.toDateString() === day.toDateString() ? null : day)}
                  className="absolute left-2 top-2 z-10 rounded px-2 py-1 text-xs font-medium bg-card/70 hover:bg-accent/50 backdrop-blur"
                >
                  {format(day, 'EEE d', { locale: ptBR })}
                </button>

                {/* Events */}
                {dayEvents.map((e, idx) => {
                  const start = new Date(e.start_date);
                  const end = new Date(e.end_date);

                  let topMin = minutesSinceStart(start);
                  let bottomMin = minutesSinceStart(end);
                  // Clamp to grid
                  topMin = Math.max(0, topMin);
                  bottomMin = Math.min(TOTAL_MINUTES, Math.max(topMin + 15, bottomMin));

                  const layout = calculateEventLayout(dayEvents, idx);
                  const top = topMin * MINUTE_HEIGHT;
                  const height = (bottomMin - topMin) * MINUTE_HEIGHT;

                  return (
                    <button
                      key={e.id}
                      onClick={() => navigate(`/dashboard/events/${e.id}`)}
                      className={cn('absolute rounded-md border p-1 text-xs shadow-sm hover-scale animate-fade-in cursor-pointer transition-transform hover:scale-105', eventVariants[idx % eventVariants.length])}
                      style={{ 
                        top, 
                        height, 
                        left: layout.left,
                        width: layout.width,
                        zIndex: layout.zIndex,
                        marginLeft: '2px',
                        marginRight: '2px'
                      }}
                      title={`${e.title} • ${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`}
                      aria-label={`Ver evento: ${e.title}`}
                    >
                      <div className="line-clamp-2 font-medium">{e.title}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
