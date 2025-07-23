import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserCourseProgress = (courseId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-course-progress', user?.id, courseId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const query = supabase
        .from('user_course_progress')
        .select(`
          *,
          course_lessons!inner(
            *,
            course_modules!inner(
              *,
              courses!inner(*)
            )
          )
        `)
        .eq('user_id', user.id);

      if (courseId) {
        query.eq('course_id', courseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });
};

export const useMarkLessonComplete = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lessonId, moduleId, courseId }: { 
      lessonId: string; 
      moduleId: string; 
      courseId: string; 
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_course_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          module_id: moduleId,
          course_id: courseId
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-course-progress'] });
    }
  });
};