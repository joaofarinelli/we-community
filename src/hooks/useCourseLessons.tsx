import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { useSupabaseContext } from '@/hooks/useSupabaseContext';

export const useCourseLessons = (moduleId: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  useSupabaseContext();

  return useQuery({
    queryKey: ['course-lessons', moduleId, user?.id, currentCompanyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!moduleId && !!user?.id && !!currentCompanyId,
  });
};