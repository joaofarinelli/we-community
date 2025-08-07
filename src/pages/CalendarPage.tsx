import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAllUserEvents } from '@/hooks/useAllUserEvents';
import { EventCard } from '@/components/events/EventCard';
import { cn } from '@/lib/utils';

export const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { data: events = [], isLoading } = useAllUserEvents();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.start_date), date)
    );
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : 
    events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate >= monthStart && eventDate <= monthEnd;
    });

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
    setSelectedDate(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6">
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
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={previousMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {monthDays.map(day => {
                    const dayEvents = getEventsForDate(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(isSelected ? null : day)}
                        className={cn(
                          "p-2 min-h-[80px] text-left border rounded-lg transition-colors",
                          "hover:bg-accent",
                          isSelected && "bg-primary text-primary-foreground",
                          isToday && !isSelected && "bg-accent border-primary"
                        )}
                      >
                        <div className="text-sm font-medium mb-1">
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              className="text-xs p-1 bg-primary/10 text-primary rounded truncate"
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - 2} mais
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Events List */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {selectedDate ? (
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
                  <div className="text-center text-muted-foreground">
                    Carregando eventos...
                  </div>
                ) : selectedEvents.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    {selectedDate ? 
                      'Nenhum evento nesta data' : 
                      'Nenhum evento neste mês'
                    }
                  </div>
                ) : (
                  selectedEvents.map(event => (
                    <div key={event.id} className="border rounded-lg p-3 space-y-2">
                      <h4 className="font-medium">{event.title}</h4>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(event.start_date), 'HH:mm')} - {format(new Date(event.end_date), 'HH:mm')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Espaço: {(event as any).spaces?.name || 'N/A'}
                      </div>
                      <div className="text-sm">
                        {event.event_participants?.length || 0} participante{(event.event_participants?.length || 0) !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};