import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useEvents = (spaceId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['events', spaceId, user?.id],
    queryFn: async () => {
      if (!user || !spaceId) return [];

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

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!spaceId,
  });
};