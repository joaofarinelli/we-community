import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from './useCompanyContext';
import { useAuth } from './useAuth';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export interface EventsAnalytics {
  totalEvents: number;
  activeEvents: number;
  draftEvents: number;
  cancelledEvents: number;
  totalParticipants: number;
  totalRevenue: number;
  averageOccupancy: number;
  onlineEvents: number;
  presentialEvents: number;
  eventsByMonth: Array<{ month: string; count: number }>;
  eventsByStatus: Array<{ status: string; count: number }>;
  participantsByMonth: Array<{ month: string; participants: number }>;
  topSpaces: Array<{ spaceName: string; eventCount: number }>;
  recentEvents: Array<{
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    status: string;
    participants_count: number;
    revenue: number;
    space_name: string;
    location_type: string;
  }>;
}

export const useEventsAnalytics = (startDate?: Date, endDate?: Date) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  // Default to last 12 months if no date range provided
  const defaultEndDate = endDate || new Date();
  const defaultStartDate = startDate || subMonths(defaultEndDate, 12);

  return useQuery({
    queryKey: ['eventsAnalytics', currentCompanyId, defaultStartDate, defaultEndDate],
    queryFn: async (): Promise<EventsAnalytics> => {
      if (!user || !currentCompanyId) throw new Error('User or company not found');

      // Set company context
      try {
        await supabase.rpc('set_current_company_context', { p_company_id: currentCompanyId });
      } catch (error) {
        console.warn('Error setting company context:', error);
      }

      // Get basic event counts
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          start_date,
          end_date,
          status,
          location_type,
          price_coins,
          max_participants,
          spaces!events_space_id_fkey(name),
          event_participants(user_id, status)
        `)
        .eq('company_id', currentCompanyId)
        .gte('start_date', defaultStartDate.toISOString())
        .lte('start_date', defaultEndDate.toISOString())
        .order('start_date', { ascending: false });

      if (eventsError) throw eventsError;

      const totalEvents = events?.length || 0;
      const activeEvents = events?.filter(e => e.status === 'active').length || 0;
      const draftEvents = events?.filter(e => e.status === 'draft').length || 0;
      const cancelledEvents = events?.filter(e => e.status === 'cancelado').length || 0;
      const onlineEvents = events?.filter(e => e.location_type === 'online').length || 0;
      const presentialEvents = events?.filter(e => e.location_type === 'presencial').length || 0;

      // Calculate participants and revenue
      let totalParticipants = 0;
      let totalRevenue = 0;
      let totalCapacity = 0;
      let eventsWithCapacity = 0;

      const recentEvents = events?.slice(0, 10).map(event => {
        const confirmedParticipants = event.event_participants?.filter(p => p.status === 'confirmed').length || 0;
        const eventRevenue = confirmedParticipants * (event.price_coins || 0);
        
        totalParticipants += confirmedParticipants;
        totalRevenue += eventRevenue;
        
        if (event.max_participants) {
          totalCapacity += event.max_participants;
          eventsWithCapacity++;
        }

        return {
          id: event.id,
          title: event.title,
          start_date: event.start_date,
          end_date: event.end_date,
          status: event.status,
          participants_count: confirmedParticipants,
          revenue: eventRevenue,
          space_name: (event.spaces as any)?.name || 'Sem espaço',
          location_type: event.location_type || 'indefinido'
        };
      }) || [];

      const averageOccupancy = eventsWithCapacity > 0 ? (totalParticipants / totalCapacity) * 100 : 0;

      // Events by month (last 12 months)
      const eventsByMonth = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(monthStart);
        const monthEvents = events?.filter(e => {
          const eventDate = new Date(e.start_date);
          return eventDate >= monthStart && eventDate <= monthEnd;
        }).length || 0;
        
        eventsByMonth.push({
          month: format(monthStart, 'MMM yyyy'),
          count: monthEvents
        });
      }

      // Participants by month
      const participantsByMonth = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(monthStart);
        const monthParticipants = events?.filter(e => {
          const eventDate = new Date(e.start_date);
          return eventDate >= monthStart && eventDate <= monthEnd;
        }).reduce((sum, e) => sum + (e.event_participants?.filter(p => p.status === 'confirmed').length || 0), 0) || 0;
        
        participantsByMonth.push({
          month: format(monthStart, 'MMM yyyy'),
          participants: monthParticipants
        });
      }

      // Events by status
      const eventsByStatus = [
        { status: 'Ativo', count: activeEvents },
        { status: 'Rascunho', count: draftEvents },
        { status: 'Cancelado', count: cancelledEvents }
      ].filter(item => item.count > 0);

      // Top spaces by event count
      const spaceEventCounts = new Map();
      events?.forEach(event => {
        const spaceName = (event.spaces as any)?.name || 'Sem espaço';
        spaceEventCounts.set(spaceName, (spaceEventCounts.get(spaceName) || 0) + 1);
      });
      
      const topSpaces = Array.from(spaceEventCounts.entries())
        .map(([spaceName, eventCount]) => ({ spaceName, eventCount }))
        .sort((a, b) => b.eventCount - a.eventCount)
        .slice(0, 5);

      return {
        totalEvents,
        activeEvents,
        draftEvents,
        cancelledEvents,
        totalParticipants,
        totalRevenue,
        averageOccupancy: Math.round(averageOccupancy * 10) / 10,
        onlineEvents,
        presentialEvents,
        eventsByMonth,
        eventsByStatus,
        participantsByMonth,
        topSpaces,
        recentEvents
      };
    },
    enabled: !!user && !!currentCompanyId,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};