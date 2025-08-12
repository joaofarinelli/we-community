import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCompanyContext } from '@/hooks/useCompanyContext';

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentCompanyId } = useCompanyContext();

  return useMutation({
    mutationFn: async (postId: string) => {
      // Ensure company context is set for RLS when user belongs to multiple companies
      if (currentCompanyId) {
        await supabase.rpc('set_current_company_context', {
          p_company_id: currentCompanyId,
        });
      }

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
      queryClient.invalidateQueries({ queryKey: ['userCoins'] });
      queryClient.invalidateQueries({ queryKey: ['pointsHistory'] });
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