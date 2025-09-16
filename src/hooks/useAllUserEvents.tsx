import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { useSupabaseContext } from './useSupabaseContext';

export const useAllUserEvents = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const { isContextReady } = useSupabaseContext();

  return useQuery({
    queryKey: ['allUserEvents', user?.id, currentCompanyId, isContextReady],
    queryFn: async () => {
      if (!user || !currentCompanyId || !isContextReady) return [];

      // Ensure company context is set
      try {
        await supabase.rpc('set_current_company_context', { p_company_id: currentCompanyId });
      } catch (error) {
        console.warn('🔧 Erro ao definir contexto da empresa:', error);
      }

      // Get ALL events from the company (RLS will handle access control)
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
        .order('start_date', { ascending: true });

      console.log('📅 TODOS os eventos carregados:', data?.length || 0);
      console.log('📊 Detalhes dos eventos:', data?.map(e => ({ 
        id: e.id,
        title: e.title, 
        start_date: e.start_date,
        end_date: e.end_date,
        status: e.status,
        space: e.spaces?.name || 'Sem espaço',
        company_id: e.company_id
      })));

      if (error) {
        console.error('❌ Erro ao carregar eventos:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user && !!currentCompanyId && isContextReady,
  });
};