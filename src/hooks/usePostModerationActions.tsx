import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HidePostParams {
  postId: string;
  reason?: string;
}

interface UnhidePostParams {
  postId: string;
}

export const useHidePost = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, reason }: HidePostParams) => {
      const { data, error } = await supabase
        .from('posts')
        .update({
          is_hidden: true,
          hidden_by: (await supabase.auth.getUser()).data.user?.id,
          hidden_at: new Date().toISOString(),
          hidden_reason: reason
        })
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Postagem ocultada",
        description: "A postagem foi ocultada com sucesso.",
      });
      // Invalidate all post queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['space-posts'] });
    },
    onError: (error) => {
      console.error('Error hiding post:', error);
      toast({
        title: "Erro",
        description: "Não foi possível ocultar a postagem.",
        variant: "destructive",
      });
    },
  });
};

export const useUnhidePost = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }: UnhidePostParams) => {
      const { data, error } = await supabase
        .from('posts')
        .update({
          is_hidden: false,
          hidden_by: null,
          hidden_at: null,
          hidden_reason: null
        })
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Postagem exibida",
        description: "A postagem foi reexibida com sucesso.",
      });
      // Invalidate all post queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['space-posts'] });
    },
    onError: (error) => {
      console.error('Error unhiding post:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reexibir a postagem.",
        variant: "destructive",
      });
    },
  });
};