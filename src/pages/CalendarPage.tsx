import { useEffect, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAllUserEvents } from '@/hooks/useAllUserEvents';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { MonthView } from '@/components/calendar/MonthView';
import { WeekView } from '@/components/calendar/WeekView';
import { DayView } from '@/components/calendar/DayView';
import { getEventsForDate, getEventsForRange, preprocessEvents } from '@/lib/date-utils';
import { useMemo } from 'react';

export const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('month');
  const { data: events = [], isLoading } = useAllUserEvents();

  // Pre-processar eventos uma vez
  const processedEvents = useMemo(() => preprocessEvents(events), [events]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weekStart = startOfWeek(currentDate, { locale: ptBR });
  const weekEnd = endOfWeek(currentDate, { locale: ptBR });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // SEO: título dinâmico
  useEffect(() => {
    const period =
      viewType === 'day'
        ? format(selectedDate ?? currentDate, "d 'de' MMMM yyyy", { locale: ptBR })
        : viewType === 'week'
        ? `${format(weekStart, "d 'de' MMM", { locale: ptBR })} - ${format(weekEnd, "d 'de' MMM yyyy", { locale: ptBR })}`
        : format(currentDate, 'MMMM yyyy', { locale: ptBR });
    document.title = `Calendário — ${period}`;
  }, [currentDate, selectedDate, viewType, weekStart, weekEnd]);

  // Substituir por funções otimizadas
  const getEventsForDateOptimized = (date: Date) => getEventsForDate(processedEvents, date);
  const getEventsForRangeOptimized = (start: Date, end: Date) => getEventsForRange(processedEvents, start, end);

  const dayTargetDate = selectedDate ?? currentDate;

  const selectedEvents =
    viewType === 'day'
      ? getEventsForDateOptimized(dayTargetDate)
      : viewType === 'week'
      ? getEventsForRangeOptimized(weekStart, weekEnd)
      : selectedDate
      ? getEventsForDateOptimized(selectedDate)
      : getEventsForRangeOptimized(monthStart, monthEnd);

  const previousPeriod = () => {
    if (viewType === 'day') {
      setCurrentDate(subDays(currentDate, 1));
    } else if (viewType === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
    setSelectedDate(null);
  };

  const nextPeriod = () => {
    if (viewType === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (viewType === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
    setSelectedDate(null);
  };

  return (
    <DashboardLayout>
      <div className="w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-6 w-6" aria-hidden="true" />
              <h1 className="text-2xl font-bold">Calendário de Eventos</h1>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" onClick={() => { setCurrentDate(new Date()); setSelectedDate(null); }}>
                        Hoje
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="icon" onClick={previousPeriod} aria-label="Período anterior">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="min-w-[220px] text-center text-lg font-semibold" aria-live="polite">
                        {viewType === 'day'
                          ? format(selectedDate ?? currentDate, "d 'de' MMMM yyyy", { locale: ptBR })
                          : viewType === 'week'
                          ? `${format(weekStart, "d 'de' MMM", { locale: ptBR })} - ${format(weekEnd, "d 'de' MMM yyyy", { locale: ptBR })}`
                          : format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                      </div>
                      <Button variant="outline" size="icon" onClick={nextPeriod} aria-label="Próximo período">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-end">
                      <Tabs value={viewType} onValueChange={(v) => setViewType(v as 'day' | 'week' | 'month')}>
                        <TabsList>
                          <TabsTrigger value="day">Dia</TabsTrigger>
                          <TabsTrigger value="week">Semana</TabsTrigger>
                          <TabsTrigger value="month">Mês</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {viewType === 'month' && (
                    <MonthView currentDate={currentDate} selectedDate={selectedDate} onSelectDate={setSelectedDate} events={processedEvents as any[]} />
                  )}

                  {viewType === 'week' && (
                    <WeekView currentDate={currentDate} selectedDate={selectedDate} onSelectDate={setSelectedDate} events={processedEvents as any[]} />
                  )}

                  {viewType === 'day' && (
                    <DayView date={selectedDate ?? currentDate} events={processedEvents as any[]} />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Events List */}
            <div className="lg:sticky lg:top-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {viewType === 'day' ? (
                      <>
                        Eventos - {format(selectedDate ?? currentDate, "d 'de' MMMM", { locale: ptBR })}
                        <Badge variant="secondary">{selectedEvents.length}</Badge>
                      </>
                    ) : viewType === 'week' ? (
                      <>
                        Eventos da Semana
                        <Badge variant="secondary">{selectedEvents.length}</Badge>
                      </>
                    ) : selectedDate ? (
                      <>
                        Eventos - {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                        <Badge variant="secondary">{selectedEvents.length}</Badge>
                      </>
                    ) : (
                      <>
                        Eventos do Mês
                        <Badge variant="secondary">{selectedEvents.length}</Badge>
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <div className="text-center text-muted-foreground">Carregando eventos...</div>
                  ) : selectedEvents.length === 0 ? (
                    <div className="text-center text-muted-foreground">
                      {viewType === 'day'
                        ? 'Nenhum evento nesta data'
                        : viewType === 'week'
                        ? 'Nenhum evento nesta semana'
                        : selectedDate
                        ? 'Nenhum evento nesta data'
                        : 'Nenhum evento neste mês'}
                    </div>
                  ) : (
                    selectedEvents.map((event) => (
                      <div key={event.id} className="rounded-lg border bg-card/50 p-3 space-y-2 hover:bg-accent/40 transition-colors">
                        <h4 className="font-medium">{event.title}</h4>
                        <div className="text-sm text-muted-foreground">
                          {format(event._parsedStartDate || new Date(event.start_date), 'HH:mm')} - {format(event._parsedEndDate || new Date(event.end_date), 'HH:mm')}
                        </div>
                        <div className="text-sm text-muted-foreground">Espaço: {(event as any).spaces?.name || 'N/A'}</div>
                        <div className="text-sm">
                          {event.event_participants?.length || 0} participante
                          {(event.event_participants?.length || 0) !== 1 ? 's' : ''}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
