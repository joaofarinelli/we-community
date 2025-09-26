import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { useSupabaseContext } from './useSupabaseContext';

/**
 * Hook to fetch upcoming events for a specific space
 */
export const useUpcomingEvents = (spaceId: string | undefined) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const { isContextReady } = useSupabaseContext();

  return useQuery({
    queryKey: ['upcomingEvents', spaceId, user?.id, currentCompanyId, isContextReady],
    queryFn: async () => {
      if (!user || !currentCompanyId || !isContextReady || !spaceId) return [];

      // Ensure company context is set
      try {
        await supabase.rpc('set_current_company_context', { p_company_id: currentCompanyId });
      } catch (error) {
        console.warn('🔧 Erro ao definir contexto da empresa:', error);
      }

      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          start_date,
          end_date,
          location,
          location_type,
          online_link,
          image_url,
          max_participants,
          payment_required,
          price_coins,
          spaces!events_space_id_fkey(
            name,
            type
          ),
          event_participants(
            id,
            user_id,
            status
          )
        `)
        .eq('space_id', spaceId)
        .eq('company_id', currentCompanyId)
        .eq('status', 'active')
        .gte('start_date', now)
        .order('start_date', { ascending: true })
        .limit(5); // Limit to next 5 upcoming events

      console.log('📅 Eventos futuros carregados:', data?.length || 0);

      if (error) {
        console.error('❌ Erro ao carregar eventos futuros:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user && !!currentCompanyId && isContextReady && !!spaceId,
  });
};