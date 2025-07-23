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
        .select(`
          *,
          profiles!post_interactions_user_id_fkey(first_name, last_name)
        `)
        .eq('post_id', postId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!postId,
  });

  const addInteraction = useMutation({
    mutationFn: async ({ type, commentText, parentCommentId }: { 
      type: 'like' | 'comment'; 
      commentText?: string; 
      parentCommentId?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('post_interactions')
        .insert({
          post_id: postId,
          user_id: user.id,
          type,
          comment_text: commentText,
          parent_comment_id: parentCommentId,
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
    mutationFn: async (type: 'like') => {
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
  const allComments = interactions?.filter(i => i.type === 'comment') || [];
  
  // Organizar comentários em estrutura hierárquica
  const mainComments = allComments.filter(c => !c.parent_comment_id);
  const replies = allComments.filter(c => c.parent_comment_id);
  
  const commentsWithReplies = mainComments.map(comment => ({
    ...comment,
    replies: replies.filter(reply => reply.parent_comment_id === comment.id)
  }));
  
  const userLiked = likes.some(i => i.user_id === user?.id);

  return {
    interactions,
    likes,
    comments: allComments,
    commentsWithReplies,
    userLiked,
    isLoading,
    addInteraction,
    removeInteraction,
  };
};