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
      console.log('🔒 Hiding post:', postId, 'reason:', reason);
      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('posts')
        .update({
          is_hidden: true,
          hidden_at: new Date().toISOString(),
          hidden_by: user.data.user.id,
          hide_reason: reason || null
        })
        .eq('id', postId)
        .select();

      if (error) {
        console.error('❌ Error hiding post:', error);
        throw error;
      }
      console.log('✅ Post hidden successfully:', data);
      return data;
    },
    onSuccess: () => {
      toast.success('Post ocultado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
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
      const { data, error } = await supabase
        .from('posts')
        .update({
          is_hidden: false,
          hidden_at: null,
          hidden_by: null,
          hide_reason: null
        })
        .eq('id', postId);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Post reexibido com sucesso');
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['space-posts'] });
    },
    onError: (error) => {
      console.error('Error unhiding post:', error);
      toast.error('Erro ao reexibir post');
    },
  });
};