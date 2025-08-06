import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HidePostParams {
  postId: string;
  reason?: string;
}

export const useHidePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, reason }: HidePostParams) => {
      const user = await supabase.auth.getUser();
      const { data, error } = await supabase.rpc('hide_post', {
        post_id: postId,
        hidden_by_user: user.data.user?.id,
        hide_reason: reason || null
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Post ocultado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['all-posts'] });
      queryClient.invalidateQueries({ queryKey: ['space-posts'] });
    },
    onError: (error) => {
      console.error('Error hiding post:', error);
      toast.error('Erro ao ocultar post');
    },
  });
};

export const useUnhidePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data, error } = await supabase.rpc('unhide_post', {
        post_id: postId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Post reexibido com sucesso');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['all-posts'] });
      queryClient.invalidateQueries({ queryKey: ['space-posts'] });
    },
    onError: (error) => {
      console.error('Error unhiding post:', error);
      toast.error('Erro ao reexibir post');
    },
  });
};