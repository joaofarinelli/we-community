import { useState } from 'react';
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

export const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('month');
  const { data: events = [], isLoading } = useAllUserEvents();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weekStart = startOfWeek(currentDate, { locale: ptBR });
  const weekEnd = endOfWeek(currentDate, { locale: ptBR });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => isSameDay(new Date(event.start_date), date));
  };

  const getEventsForRange = (start: Date, end: Date) => {
    return events.filter((event) => {
      const d = new Date(event.start_date);
      return d >= start && d <= end;
    });
  };

  const dayTargetDate = selectedDate ?? currentDate;

  const selectedEvents =
    viewType === 'day'
      ? getEventsForDate(dayTargetDate)
      : viewType === 'week'
      ? getEventsForRange(weekStart, weekEnd)
      : selectedDate
      ? getEventsForDate(selectedDate)
      : events.filter((event) => {
          const eventDate = new Date(event.start_date);
          return eventDate >= monthStart && eventDate <= monthEnd;
        });

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Calendário de Eventos</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle>
                        {viewType === 'day'
                          ? format(selectedDate ?? currentDate, "d 'de' MMMM yyyy", { locale: ptBR })
                          : viewType === 'week'
                          ? `${format(weekStart, "d 'de' MMM", { locale: ptBR })} - ${format(weekEnd, "d 'de' MMM yyyy", { locale: ptBR })}`
                          : format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                      </CardTitle>
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 flex gap-2">
                      <Button variant="outline" size="icon" onClick={previousPeriod}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={nextPeriod}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
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
                    <MonthView currentDate={currentDate} selectedDate={selectedDate} onSelectDate={setSelectedDate} events={events as any[]} />
                  )}

                  {viewType === 'week' && (
                    <WeekView currentDate={currentDate} selectedDate={selectedDate} onSelectDate={setSelectedDate} events={events as any[]} />
                  )}

                  {viewType === 'day' && (
                    <DayView date={selectedDate ?? currentDate} events={events as any[]} />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Events List */}
            <div>
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
                      <div key={event.id} className="border rounded-lg p-3 space-y-2">
                        <h4 className="font-medium">{event.title}</h4>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(event.start_date), 'HH:mm')} - {format(new Date(event.end_date), 'HH:mm')}
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
