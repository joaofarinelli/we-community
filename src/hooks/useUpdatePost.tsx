import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useContentModeration } from '@/hooks/useContentModeration';

interface UpdatePostData {
  title?: string;
  content?: string;
  hide_author?: boolean;
  hide_comments?: boolean;
  hide_likes?: boolean;
  is_pinned?: boolean;
}

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { moderateContent } = useContentModeration();

  return useMutation({
    mutationFn: async ({ postId, data }: { postId: string; data: UpdatePostData }) => {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.hide_author !== undefined) updateData.hide_author = data.hide_author;
      if (data.hide_comments !== undefined) updateData.hide_comments = data.hide_comments;
      if (data.hide_likes !== undefined) updateData.hide_likes = data.hide_likes;
      if (data.is_pinned !== undefined) updateData.is_pinned = data.is_pinned;

      // Check content moderation if content is being updated
      if (data.content !== undefined) {
        try {
          const moderationResult = await moderateContent({
            content: data.content,
            contentType: 'post',
            postId
          });
          
          if (moderationResult.isRestricted) {
            updateData.is_restricted = true;
            updateData.auto_flagged = true;
            updateData.flagged_reason = `Conteúdo automaticamente restrito: ${moderationResult.flaggedWords?.join(', ')}`;
            updateData.flagged_at = new Date().toISOString();
          }
        } catch (moderationError) {
          console.error('Moderation check failed:', moderationError);
          // Continue with update even if moderation fails
        }
      }

      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Force invalidation and refetch of all post-related queries
      queryClient.invalidateQueries({ 
        queryKey: ['posts'], 
        refetchType: 'all' 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['allPosts'], 
        refetchType: 'all' 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['spacePosts'], 
        refetchType: 'all' 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['userPosts'], 
        refetchType: 'all' 
      });
      
      // Force refetch of all queries to ensure UI updates
      queryClient.refetchQueries({ 
        predicate: (query) => 
          query.queryKey[0] === 'posts' || 
          query.queryKey[0] === 'allPosts' || 
          query.queryKey[0] === 'spacePosts' ||
          query.queryKey[0] === 'userPosts'
      });
      
      toast({
        title: "Post atualizado",
        description: "O post foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar post",
        description: "Não foi possível atualizar o post. Tente novamente.",
        variant: "destructive",
      });
      console.error('Error updating post:', error);
    },
  });
};