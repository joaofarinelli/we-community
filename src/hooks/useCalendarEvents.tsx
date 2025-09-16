import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { useSupabaseContext } from './useSupabaseContext';

/**
 * Hook specifically for calendar events - excludes draft events
 * Draft events should only be visible in the space's draft tab
 */
export const useCalendarEvents = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const { isContextReady } = useSupabaseContext();

  return useQuery({
    queryKey: ['calendarEvents', user?.id, currentCompanyId, isContextReady],
    queryFn: async () => {
      if (!user || !currentCompanyId || !isContextReady) return [];

      // Ensure company context is set
      try {
        await supabase.rpc('set_current_company_context', { p_company_id: currentCompanyId });
      } catch (error) {
        console.warn('🔧 Erro ao definir contexto da empresa:', error);
      }

      // Get ONLY active events (exclude drafts from calendar)
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          spaces!events_space_id_fkey(
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

      console.log('📅 Eventos do calendário carregados (apenas ativos):', data?.length || 0);

      if (error) {
        console.error('❌ Erro ao carregar eventos do calendário:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user && !!currentCompanyId && isContextReady,
  });
};