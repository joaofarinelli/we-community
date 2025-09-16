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
          spaces(
            name,
            visibility
          ),
          event_participants(
            id,
            user_id,
            status
          )
        `)
        .eq('company_id', currentCompanyId)
        .eq('status', 'active')
        .order('start_date', { ascending: true });

      console.log('📅 Eventos carregados:', data?.length || 0, data?.map(e => ({ 
        title: e.title, 
        date: e.start_date,
        space: e.spaces?.name || 'Sem espaço' 
      })));

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentCompanyId,
  });
};