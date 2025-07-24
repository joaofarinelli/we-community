import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useLessonLikes = (lessonId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: likes, isLoading } = useQuery({
    queryKey: ['lesson-likes', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_likes')
        .select('*')
        .eq('lesson_id', lessonId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!lessonId
  });

  const isLiked = likes?.some(like => like.user_id === user?.id) || false;

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      if (isLiked) {
        const { error } = await supabase
          .from('lesson_likes')
          .delete()
          .eq('lesson_id', lessonId)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lesson_likes')
          .insert({ lesson_id: lessonId, user_id: user.id });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-likes', lessonId] });
    }
  });

  return {
    data: likes,
    isLiked,
    isLoading,
    toggleLike: toggleLikeMutation.mutate
  };
};