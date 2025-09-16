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
 * Considera eventos que começam, terminam ou passam pela data especificada
 */
export function getEventsForDate(events: any[], date: Date) {
  return events.filter(event => {
    const startDate = event._parsedStartDate || parseEventDate(event.start_date);
    const endDate = event._parsedEndDate || parseEventDate(event.end_date);
    
    // Evento acontece se a data está entre o início e fim (inclusive)
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    return dateOnly >= startOnly && dateOnly <= endOnly;
  });
}

/**
 * Filtra eventos para um range de datas
 */
export function getEventsForRange(events: any[], startDate: Date, endDate: Date) {
  return events.filter(event => {
    const eventStartDate = event._parsedStartDate || parseEventDate(event.start_date);
    const eventEndDate = event._parsedEndDate || parseEventDate(event.end_date);
    
    // Evento se sobrepõe ao range se:
    // - Começa antes do final do range E termina depois do início do range
    return eventStartDate <= endDate && eventEndDate >= startDate;
  });
}

/**
 * Filtra eventos que se sobrepõem a um intervalo específico (para visualizações de hora)
 */
export function getEventsOverlappingInterval(events: any[], intervalStart: Date, intervalEnd: Date) {
  return events.filter(event => {
    const eventStartDate = event._parsedStartDate || parseEventDate(event.start_date);
    const eventEndDate = event._parsedEndDate || parseEventDate(event.end_date);
    
    // Evento se sobrepõe ao intervalo se:
    // - Começa antes do final do intervalo E termina depois do início do intervalo
    return eventStartDate < intervalEnd && eventEndDate > intervalStart;
  });
}