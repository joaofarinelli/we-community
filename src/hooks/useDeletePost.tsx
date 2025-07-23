import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
      queryClient.invalidateQueries({ queryKey: ['spacePosts'] });
      toast({
        title: "Post deletado",
        description: "O post foi deletado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao deletar post",
        description: "Não foi possível deletar o post. Tente novamente.",
        variant: "destructive",
      });
      console.error('Error deleting post:', error);
    },
  });
};