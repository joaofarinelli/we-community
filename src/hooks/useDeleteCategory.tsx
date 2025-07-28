import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useDeleteCategory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      if (!user) throw new Error('Usuário não autenticado');

      // First check if category has spaces
      const { data: spaces } = await supabase
        .from('spaces')
        .select('id')
        .eq('category_id', categoryId);

      if (spaces && spaces.length > 0) {
        throw new Error('Não é possível deletar uma categoria que contém espaços');
      }

      const { error } = await supabase
        .from('space_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaceCategories'] });
      toast.success('Categoria deletada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao deletar categoria:', error);
      toast.error(error.message || 'Erro ao deletar categoria. Tente novamente.');
    },
  });

  return {
    deleteCategory: deleteCategoryMutation.mutate,
    isLoading: deleteCategoryMutation.isPending,
  };
};