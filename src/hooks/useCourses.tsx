import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { ensureCompanyContext } from '@/lib/ensureCompanyContext';

export const useCourses = (contextReady = true) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['courses', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId) return [];

      console.debug('useCourses: Starting query for company:', currentCompanyId);

      // Ensure company context is set before the query
      await ensureCompanyContext(currentCompanyId);

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('company_id', currentCompanyId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('useCourses: Error fetching courses:', error);
        throw error;
      }

      console.debug('useCourses: Successfully fetched', data?.length || 0, 'courses');
      return data;
    },
    enabled: !!user?.id && !!currentCompanyId && contextReady,
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};