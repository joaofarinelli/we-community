import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const usePostInteractions = (postId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: interactions, isLoading } = useQuery({
    queryKey: ['postInteractions', postId, user?.id],
    queryFn: async () => {
      if (!user || !postId) return [];

      const { data, error } = await supabase
        .from('post_interactions')
        .select('*')
        .eq('post_id', postId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!postId,
  });

  const addInteraction = useMutation({
    mutationFn: async ({ type, commentText }: { type: 'like' | 'love' | 'comment'; commentText?: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('post_interactions')
        .insert({
          post_id: postId,
          user_id: user.id,
          type,
          comment_text: commentText,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postInteractions', postId] });
    },
    onError: (error) => {
      toast.error('Erro ao adicionar interação');
      console.error(error);
    },
  });

  const removeInteraction = useMutation({
    mutationFn: async (type: 'like' | 'love') => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('post_interactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .eq('type', type);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postInteractions', postId] });
    },
    onError: (error) => {
      toast.error('Erro ao remover interação');
      console.error(error);
    },
  });

  const likes = interactions?.filter(i => i.type === 'like') || [];
  const loves = interactions?.filter(i => i.type === 'love') || [];
  const comments = interactions?.filter(i => i.type === 'comment') || [];
  
  const userLiked = likes.some(i => i.user_id === user?.id);
  const userLoved = loves.some(i => i.user_id === user?.id);

  return {
    interactions,
    likes,
    loves,
    comments,
    userLiked,
    userLoved,
    isLoading,
    addInteraction,
    removeInteraction,
  };
};