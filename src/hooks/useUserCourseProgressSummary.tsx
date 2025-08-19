import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export interface UserCourseProgress {
  course_id: string;
  course_title: string;
  total_lessons: number;
  completed_lessons: number;
  progress_percent: number;
  is_completed: boolean;
  certificate_issued: boolean;
  certificate_code?: string;
  certificate_issued_at?: string;
}

export const useUserCourseProgressSummary = (userId: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['user-course-progress-summary', userId, currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId || !userId) return [];

      console.log('Fetching course progress summary for user:', userId);

      const { data, error } = await supabase.rpc('get_user_course_progress_summary', {
        p_user_id: userId,
        p_company_id: currentCompanyId
      });

      if (error) {
        console.error('Error fetching user course progress:', error);
        throw error;
      }

      return (data || []) as UserCourseProgress[];
    },
    enabled: !!user?.id && !!currentCompanyId && !!userId,
  });
};