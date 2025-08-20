import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { useSupabaseContext } from '@/hooks/useSupabaseContext';

export const useCourses = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  useSupabaseContext();

  return useQuery({
    queryKey: ['courses', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId) return [];

      console.log('useCourses: Setting context for company:', currentCompanyId);

      // Definir explicitamente o contexto da empresa antes da consulta
      await supabase.rpc('set_current_company_context', {
        p_company_id: currentCompanyId
      });

      console.log('useCourses: Fetching courses for company:', currentCompanyId);

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

      console.log('useCourses: Successfully fetched', data?.length || 0, 'courses');
      return data;
    },
    enabled: !!user?.id && !!currentCompanyId,
    retry: 0,
    refetchOnWindowFocus: false,
  });
};