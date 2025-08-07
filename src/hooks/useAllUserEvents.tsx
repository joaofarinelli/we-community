import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export const useAllUserEvents = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['allUserEvents', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

      // Get all events from spaces the user has access to
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          spaces!inner(
            name,
            visibility
          ),
          event_participants!inner(
            id,
            user_id,
            status
          )
        `)
        .eq('company_id', currentCompanyId)
        .eq('status', 'active')
        .eq('event_participants.user_id', user.id)
        .eq('event_participants.status', 'confirmed')
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentCompanyId,
  });
};