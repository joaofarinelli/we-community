import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useEventDetails = (eventId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['eventDetails', eventId, user?.id],
    queryFn: async () => {
      if (!user || !eventId) return null;

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
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!eventId,
  });
};