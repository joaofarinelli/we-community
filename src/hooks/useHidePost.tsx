
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompanyContext } from '@/hooks/useCompanyContext';

interface HidePostParams {
  postId: string;
  reason?: string;
}

export const useHidePost = () => {
  const queryClient = useQueryClient();
  const { currentCompanyId } = useCompanyContext();

  return useMutation({
    mutationFn: async ({ postId, reason }: HidePostParams) => {
      console.log('🔒 Hiding post:', postId, 'reason:', reason);
      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) throw new Error('User not authenticated');

      // Set company context for RLS when user belongs to multiple companies
      if (currentCompanyId) {
        const { error: ctxError } = await supabase.rpc('set_current_company_context', {
          p_company_id: currentCompanyId,
        });
        if (ctxError) {
          console.warn('Failed to set company context before hiding post:', ctxError);
        }
      }

      let query = supabase
        .from('posts')
        .update({
          is_hidden: true,
          hidden_at: new Date().toISOString(),
          hidden_by: user.data.user.id,
          hidden_reason: reason || null
        })
        .eq('id', postId);

      if (currentCompanyId) {
        query = query.eq('company_id', currentCompanyId);
      }

      const { data, error } = await query.select();

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
          hidden_reason: null
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
