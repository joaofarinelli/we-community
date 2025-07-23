import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ReorderSpacesData {
  categoryId: string;
  spaceUpdates: Array<{
    id: string;
    order_index: number;
  }>;
}

export const useReorderSpaces = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReorderSpacesData) => {
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Update all spaces in a single transaction
      const updates = data.spaceUpdates.map(update => 
        supabase
          .from('spaces')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
      );

      const results = await Promise.all(updates);
      
      // Check for any errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error('Erro ao reordenar espaços');
      }

      return results;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spaces', variables.categoryId] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
    onError: (error) => {
      console.error('Erro ao reordenar espaços:', error);
      toast.error('Erro ao reordenar espaços. Tente novamente.');
    },
  });
};