import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { useSupabaseContext } from '@/hooks/useSupabaseContext';
import { useCourseLessons } from '@/hooks/useCourseLessons';
import { useUserCourseProgress } from '@/hooks/useUserCourseProgress';

export const useLessonAccess = (moduleId: string, courseId: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const { isContextReady } = useSupabaseContext();

  const { data: lessons, isLoading: lessonsLoading } = useCourseLessons(moduleId);
  const { data: progress, isLoading: progressLoading } = useUserCourseProgress(courseId);

  return useQuery({
    queryKey: ['lesson-access', moduleId, courseId, user?.id, currentCompanyId],
    queryFn: async () => {
      if (!lessons || !user?.id || !currentCompanyId) return {};

      // Get module details to check if linear progression is enabled
      const { data: module, error: moduleError } = await supabase
        .from('course_modules')
        .select('linear_lesson_progression')
        .eq('id', moduleId)
        .single();

      if (moduleError) throw moduleError;

      // If linear progression is disabled, all lessons are accessible
      if (!module.linear_lesson_progression) {
        const accessMap: Record<string, boolean> = {};
        lessons.forEach(lesson => {
          accessMap[lesson.id] = true;
        });
        return accessMap;
      }

      // Sort lessons by order_index to ensure correct sequence
      const sortedLessons = [...lessons].sort((a, b) => a.order_index - b.order_index);
      
      // Get completed lessons
      const completedLessons = progress?.filter(p => 
        sortedLessons.some(lesson => lesson.id === p.lesson_id) && p.completed_at
      ) || [];

      const accessMap: Record<string, boolean> = {};

      // First lesson is always accessible
      if (sortedLessons.length > 0) {
        accessMap[sortedLessons[0].id] = true;
      }

      // Check access for remaining lessons
      for (let i = 1; i < sortedLessons.length; i++) {
        const currentLesson = sortedLessons[i];
        const previousLesson = sortedLessons[i - 1];

        // Check if previous lesson is completed
        const isPreviousCompleted = completedLessons.some(
          completed => completed.lesson_id === previousLesson.id
        );

        accessMap[currentLesson.id] = isPreviousCompleted;
      }

      return accessMap;
    },
    enabled: !!moduleId && !!courseId && !!user?.id && !!currentCompanyId && 
             !lessonsLoading && !progressLoading && !!lessons && isContextReady
  });
};