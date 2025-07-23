import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpdatePostData {
  title?: string;
  content: string;
}

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, data }: { postId: string; data: UpdatePostData }) => {
      const { error } = await supabase
        .from('posts')
        .update({
          title: data.title,
          content: data.content,
          updated_at: new Date().toISOString(),
        })
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