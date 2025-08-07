import { eachDayOfInterval, endOfWeek, format, isSameDay, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';


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

export const WeekView = ({ currentDate, selectedDate, onSelectDate, events }: WeekViewProps) => {
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
            const dayEvents = events
              .filter((e) => isSameDay(new Date(e.start_date), day))
              .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

            // Simple overlap handling using active stack for left offset
            const active: { end: number }[] = [];

            return (
              <div key={day.toISOString()} className="relative border-l first:border-l-0" style={{ height: GRID_HEIGHT }}>
                {/* Hour lines */}
                {hours.map((h) => (
                  <div key={h} className="absolute left-0 right-0 border-t border-dashed" style={{ top: (h - START_HOUR) * 60 * MINUTE_HEIGHT }} />
                ))}

                {/* Day header */}
                <button
                  onClick={() => onSelectDate(selectedDate && isSameDay(selectedDate, day) ? null : day)}
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

                  // Clear inactive from active stack
                  for (let i = active.length - 1; i >= 0; i--) {
                    if (active[i].end <= topMin) active.splice(i, 1);
                  }
                  const offset = active.length; // how many overlaps currently active
                  active.push({ end: bottomMin });

                  const top = topMin * MINUTE_HEIGHT;
                  const height = (bottomMin - topMin) * MINUTE_HEIGHT;

                  return (
                    <div
                      key={e.id}
                      className={cn('absolute left-1 right-1 rounded-md border p-2 text-xs shadow-sm hover-scale animate-fade-in', eventVariants[idx % eventVariants.length])}
                      style={{ top, height, marginLeft: offset * 8 }}
                      role="button"
                      title={`${e.title} • ${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`}
                      aria-label={`Evento ${e.title}`}
                    >
                      <div className="line-clamp-2 font-medium">{e.title}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                      </div>
                    </div>
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
