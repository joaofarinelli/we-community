import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ReorderTrailTemplatesData {
  trailUpdates: Array<{
    id: string;
    order_index: number;
  }>;
}

export const useReorderTrailTemplates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReorderTrailTemplatesData) => {
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Update all trail templates in a single transaction
      const updates = data.trailUpdates.map(update => 
        supabase
          .from('trail_templates')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
      );

      const results = await Promise.all(updates);
      
      // Check for any errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error('Erro ao reordenar trilhas');
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trail-templates'] });
      toast.success('Ordem das trilhas atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao reordenar trilhas:', error);
      toast.error('Erro ao reordenar trilhas. Tente novamente.');
    },
  });
};