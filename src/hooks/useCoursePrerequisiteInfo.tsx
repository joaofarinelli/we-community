import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export const useCoursePrerequisiteInfo = (courseId: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['course-prerequisite-info', courseId, user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId || !courseId) {
        return null;
      }

      // Get course info first
      const { data: course, error } = await supabase
        .from('courses')
        .select('id, title, prerequisite_course_id')
        .eq('id', courseId)
        .eq('company_id', currentCompanyId)
        .single();

      if (error || !course) {
        return null;
      }

      // If no prerequisite, return null
      if (!course.prerequisite_course_id) {
        return null;
      }

      // Get prerequisite course info
      const { data: prerequisiteCourse } = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', course.prerequisite_course_id)
        .eq('company_id', currentCompanyId)
        .single();

      // Check if prerequisite is completed
      const { data: isCompleted } = await supabase.rpc('check_course_completion', {
        p_user_id: user.id,
        p_course_id: course.prerequisite_course_id
      });

      return {
        prerequisiteCourse: prerequisiteCourse,
        isCompleted: isCompleted || false,
        hasPrerequisite: true
      };
    },
    enabled: !!user?.id && !!currentCompanyId && !!courseId,
  });
};