import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getEventsOverlappingInterval } from '@/lib/date-utils';
import { useNavigate } from 'react-router-dom';

interface DayViewProps {
  date: Date;
  events: any[];
}

const START_HOUR = 7;
const END_HOUR = 23;
const MINUTE_HEIGHT = 1;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
const GRID_HEIGHT = TOTAL_MINUTES * MINUTE_HEIGHT;

// Visual variants for events using design tokens
const eventVariants = [
  'bg-primary/10 text-primary',
  'bg-accent/10 text-accent-foreground',
  'bg-secondary/10 text-secondary-foreground',
  'bg-destructive/10 text-destructive',
];

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

export const DayView = ({ date, events }: DayViewProps) => {
  const navigate = useNavigate();
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  
  // Create day interval (start and end of day)
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
  
  // Filter events that overlap with this day using preprocessed dates
  const dayEvents = getEventsOverlappingInterval(events, dayStart, dayEnd)
    .sort((a, b) => {
      const aStart = a._parsedStartDate || new Date(a.start_date);
      const bStart = b._parsedStartDate || new Date(b.start_date);
      return aStart.getTime() - bStart.getTime();
    });

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

        {/* Day column */}
        <div className="relative flex-1" style={{ height: GRID_HEIGHT }}>
          {hours.map((h) => (
            <div key={h} className="absolute left-0 right-0 border-t border-dashed" style={{ top: (h - START_HOUR) * 60 * MINUTE_HEIGHT }} />
          ))}

          <div className="absolute left-2 top-2 z-10 rounded px-2 py-1 text-xs font-medium bg-card/70 backdrop-blur">
            {format(date, 'EEEE, d', { locale: ptBR })}
          </div>

          {dayEvents.map((e, idx) => {
            const start = new Date(e.start_date);
            const end = new Date(e.end_date);
            let topMin = minutesSinceStart(start);
            let bottomMin = minutesSinceStart(end);
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
                  marginLeft: '4px',
                  marginRight: '4px'
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
      </div>
    </div>
  );
};
