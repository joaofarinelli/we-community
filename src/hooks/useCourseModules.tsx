import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { useSupabaseContext } from '@/hooks/useSupabaseContext';

export const useCourseModules = (courseId: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const { isContextReady } = useSupabaseContext();

  return useQuery({
    queryKey: ['course-modules', courseId, user?.id, currentCompanyId],
    queryFn: async () => {
      console.log('🔍 useCourseModules: Query enabled - courseId:', !!courseId, 'user:', !!user?.id, 'company:', !!currentCompanyId, 'contextReady:', isContextReady);
      
      const { data, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!courseId && !!user?.id && !!currentCompanyId && isContextReady,
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes to prevent disappearing
    refetchOnWindowFocus: false, // Don't refetch when tab becomes active
  });
};