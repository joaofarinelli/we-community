import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useLessonFavorites = (lessonId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites, isLoading } = useQuery({
    queryKey: ['lesson-favorites', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_favorites')
        .select('*')
        .eq('lesson_id', lessonId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!lessonId
  });

  const isFavorited = favorites?.some(fav => fav.user_id === user?.id) || false;

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      if (isFavorited) {
        const { error } = await supabase
          .from('lesson_favorites')
          .delete()
          .eq('lesson_id', lessonId)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lesson_favorites')
          .insert({ lesson_id: lessonId, user_id: user.id });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-favorites', lessonId] });
    }
  });

  return {
    data: favorites,
    isFavorited,
    isLoading,
    toggleFavorite: toggleFavoriteMutation.mutate
  };
};