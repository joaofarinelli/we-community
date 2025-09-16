import { isSameDay, parseISO } from 'date-fns';

/**
 * Parseia uma data ISO string do Supabase para um objeto Date
 * Trata corretamente timezone UTC
 */
export function parseEventDate(dateString: string): Date {
  try {
    // Se já tem timezone info, usa parseISO
    if (dateString.includes('+') || dateString.includes('Z')) {
      return parseISO(dateString);
    }
    // Se não tem timezone, assume UTC e converte
    return parseISO(dateString + 'Z');
  } catch {
    // Fallback para new Date
    return new Date(dateString);
  }
}

/**
 * Compara se duas datas são do mesmo dia, tratando corretamente eventos do Supabase
 */
export function isSameDayEvent(eventDateString: string, compareDate: Date): boolean {
  const eventDate = parseEventDate(eventDateString);
  return isSameDay(eventDate, compareDate);
}

/**
 * Pre-processa eventos para otimizar filtragem
 */
export function preprocessEvents(events: any[]) {
  return events.map(event => ({
    ...event,
    _parsedStartDate: parseEventDate(event.start_date),
    _parsedEndDate: parseEventDate(event.end_date),
  }));
}

/**
 * Filtra eventos para uma data específica usando datas pre-processadas
 */
export function getEventsForDate(events: any[], date: Date) {
  return events.filter(event => {
    const eventDate = event._parsedStartDate || parseEventDate(event.start_date);
    return isSameDay(eventDate, date);
  });
}

/**
 * Filtra eventos para um range de datas
 */
export function getEventsForRange(events: any[], startDate: Date, endDate: Date) {
  return events.filter(event => {
    const eventDate = event._parsedStartDate || parseEventDate(event.start_date);
    return eventDate >= startDate && eventDate <= endDate;
  });
}