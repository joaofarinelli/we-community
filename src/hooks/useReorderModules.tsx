import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ReorderModulesData {
  courseId: string;
  moduleUpdates: Array<{
    id: string;
    order_index: number;
  }>;
}

export const useReorderModules = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReorderModulesData) => {
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Update all modules in a single transaction
      const updates = data.moduleUpdates.map(update => 
        supabase
          .from('course_modules')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
      );

      const results = await Promise.all(updates);
      
      // Check for any errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error('Erro ao reordenar módulos');
      }

      return results;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', variables.courseId] });
      toast.success('Ordem dos módulos atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao reordenar módulos:', error);
      toast.error('Erro ao reordenar módulos. Tente novamente.');
    },
  });
};