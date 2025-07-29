import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useEvents = (spaceId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['events', spaceId, user?.id],
    queryFn: async () => {
      if (!user || !spaceId) {
        console.log('useEvents: Missing user or spaceId', { user: !!user, spaceId });
        return [];
      }

      console.log('useEvents: Fetching events for space:', spaceId);

      // First test: direct query without RLS to see if events exist
      const { data: allEvents, error: allEventsError } = await supabase
        .from('events')
        .select('*')
        .eq('space_id', spaceId);
      
      console.log('useEvents: All events in space (bypassing RLS):', { 
        count: allEvents?.length || 0, 
        events: allEvents,
        error: allEventsError 
      });

      // Now try the normal query with RLS
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_participants(
            id,
            user_id,
            status
          )
        `)
        .eq('space_id', spaceId)
        .in('status', ['active', 'draft'])
        .order('start_date', { ascending: true });

      console.log('useEvents: RLS filtered query result', { data, error, spaceId });

      if (error) {
        console.error('useEvents: Query error', error);
        throw error;
      }
      
      console.log('useEvents: Returning data', data?.length || 0, 'events');
      return data || [];
    },
    enabled: !!user && !!spaceId,
  });
};