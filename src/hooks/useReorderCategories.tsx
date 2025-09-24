import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ReorderCategoriesData {
  categoryUpdates: Array<{
    id: string;
    order_index: number;
  }>;
}

export const useReorderCategories = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReorderCategoriesData) => {
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Update all categories in a single transaction
      const updates = data.categoryUpdates.map(update => 
        supabase
          .from('space_categories')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
      );

      const results = await Promise.all(updates);
      
      // Check for any errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error('Erro ao reordenar categorias');
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-space-categories'] });
      queryClient.invalidateQueries({ queryKey: ['spaceCategories'] });
    },
    onError: (error) => {
      console.error('Erro ao reordenar categorias:', error);
      toast.error('Erro ao reordenar categorias. Tente novamente.');
    },
  });
};