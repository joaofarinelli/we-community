import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseContext } from '@/hooks/useSupabaseContext';

export const useUserCourseProgress = (courseId?: string) => {
  const { user } = useAuth();
  const { isContextReady } = useSupabaseContext();
  
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
    enabled: !!user?.id && isContextReady
  });
};

export const useMarkLessonComplete = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isContextReady } = useSupabaseContext();

  return useMutation({
    mutationFn: async ({ lessonId, moduleId, courseId }: { 
      lessonId: string; 
      moduleId: string; 
      courseId: string; 
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Check if already completed
      const { data: existing } = await supabase
        .from('user_course_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (existing) {
        return { alreadyCompleted: true, rewards: null };
      }

      // Mark as completed
      const { data, error } = await supabase
        .from('user_course_progress')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          module_id: moduleId,
          course_id: courseId
        })
        .select()
        .single();

      if (error) throw error;

      // Calculate rewards after completion
      const rewards = await calculateCompletionRewards(user.id, lessonId, moduleId, courseId);

      return { alreadyCompleted: false, rewards, progress: data };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['user-course-progress'] });
      queryClient.invalidateQueries({ queryKey: ['userCoins'] });
      
      if (result.rewards) {
        // Trigger reward notification
        queryClient.setQueryData(['lesson-completion-reward'], result.rewards);
      }
    }
  });
};

// Helper function to calculate rewards
const calculateCompletionRewards = async (
  userId: string, 
  lessonId: string, 
  moduleId: string, 
  courseId: string
) => {
  const rewards = {
    lessonCoins: 15, // From calculate_coins_for_action function
    moduleComplete: false,
    moduleCoins: 0,
    courseComplete: false,
    courseCoins: 0
  };

  // Check if module is now completed
  const { data: moduleCompleted } = await supabase
    .rpc('check_module_completion', {
      p_user_id: userId,
      p_module_id: moduleId
    });

  if (moduleCompleted) {
    rewards.moduleComplete = true;
    rewards.moduleCoins = 50;

    // Check if course is now completed  
    const { data: courseCompleted } = await supabase
      .rpc('check_course_completion', {
        p_user_id: userId,
        p_course_id: courseId
      });

    if (courseCompleted) {
      rewards.courseComplete = true;
      rewards.courseCoins = 200;
    }
  }

  return rewards;
};