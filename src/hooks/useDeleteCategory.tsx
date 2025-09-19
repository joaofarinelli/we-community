import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { useInvalidateQueries } from './useInvalidateQueries';
import { toast } from 'sonner';

export const useDeleteCategory = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const invalidateQueries = useInvalidateQueries();
  const queryClient = useQueryClient();

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      console.log('Tentando deletar categoria:', categoryId);
      
      if (!user) {
        console.error('Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      console.log('Verificando se categoria tem espaços...');
      // First check if category has spaces
      const { data: spaces, error: spacesError } = await supabase
        .from('spaces')
        .select('id')
        .eq('category_id', categoryId);

      if (spacesError) {
        console.error('Erro ao verificar espaços:', spacesError);
        throw new Error('Erro ao verificar espaços vinculados');
      }

      console.log('Espaços encontrados:', spaces);

      if (spaces && spaces.length > 0) {
        console.error('Categoria tem espaços vinculados');
        throw new Error('Não é possível deletar uma categoria que contém espaços');
      }

      console.log('Deletando categoria...');
      const { error } = await supabase
        .from('space_categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        console.error('Erro ao deletar categoria:', error);
        throw error;
      }
      
      console.log('Categoria deletada com sucesso');
    },
    onSuccess: () => {
      // Invalidate all category-related queries with proper company context
      invalidateQueries.invalidateSpaceCategories();
      invalidateQueries.invalidateQuery('admin-space-categories');
      invalidateQueries.invalidateQuery('admin-categories-creators');
      invalidateQueries.invalidateQuery('admin-categories-spaces-count');
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