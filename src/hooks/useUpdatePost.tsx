import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useContentModeration } from '@/hooks/useContentModeration';

interface UpdatePostData {
  title?: string;
  content?: string;
  hide_author?: boolean;
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
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
      queryClient.invalidateQueries({ queryKey: ['spacePosts'] });
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