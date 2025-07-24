import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface LessonComment {
  id: string;
  lesson_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: {
    first_name: string;
    last_name: string;
  };
  replies?: LessonComment[];
}

export const useLessonComments = (lessonId: string) => {
  return useQuery({
    queryKey: ['lesson-comments', lessonId],
    queryFn: async () => {
      // First get all comments for the lesson
      const { data: allComments, error } = await supabase
        .from('lesson_comments')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!allComments) return [];

      // Get all user profiles for the comments
      const userIds = [...new Set(allComments.map(comment => comment.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Create a profile map for easy lookup
      const profileMap = new Map(
        profiles?.map(profile => [profile.user_id, profile]) || []
      );

      // Separate root comments and replies
      const rootComments = allComments.filter(comment => !comment.parent_comment_id);
      const replies = allComments.filter(comment => comment.parent_comment_id);

      // Build the nested structure
      const commentsWithReplies = rootComments.map(comment => ({
        ...comment,
        author: profileMap.get(comment.user_id),
        replies: replies
          .filter(reply => reply.parent_comment_id === comment.id)
          .map(reply => ({
            ...reply,
            author: profileMap.get(reply.user_id)
          }))
      }));

      return commentsWithReplies;
    },
    enabled: !!lessonId
  });
};

export const useCreateLessonComment = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      lessonId, 
      content, 
      parentCommentId 
    }: { 
      lessonId: string; 
      content: string; 
      parentCommentId?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('lesson_comments')
        .insert({
          lesson_id: lessonId,
          user_id: user.id,
          content,
          parent_comment_id: parentCommentId || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-comments', variables.lessonId] });
      toast.success('Comentário adicionado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao adicionar comentário');
    }
  });
};

export const useUpdateLessonComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      commentId, 
      content,
      lessonId 
    }: { 
      commentId: string; 
      content: string;
      lessonId: string;
    }) => {
      const { data, error } = await supabase
        .from('lesson_comments')
        .update({ content })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-comments', variables.lessonId] });
      toast.success('Comentário atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar comentário');
    }
  });
};

export const useDeleteLessonComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      commentId,
      lessonId 
    }: { 
      commentId: string;
      lessonId: string;
    }) => {
      const { error } = await supabase
        .from('lesson_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-comments', variables.lessonId] });
      toast.success('Comentário excluído com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir comentário');
    }
  });
};