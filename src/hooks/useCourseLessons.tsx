import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCourseLessons = (moduleId: string) => {
  return useQuery({
    queryKey: ['course-lessons', moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!moduleId
  });
};