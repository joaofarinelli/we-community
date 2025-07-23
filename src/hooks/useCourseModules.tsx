import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCourseModules = (courseId: string) => {
  return useQuery({
    queryKey: ['course-modules', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!courseId
  });
};