import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ReorderCoursesData {
  courseUpdates: Array<{
    id: string;
    order_index: number;
  }>;
}

export const useReorderCourses = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReorderCoursesData) => {
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Update all courses in a single transaction
      const updates = data.courseUpdates.map(update => 
        supabase
          .from('courses')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
      );

      const results = await Promise.all(updates);
      
      // Check for any errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error('Erro ao reordenar cursos');
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Ordem dos cursos atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao reordenar cursos:', error);
      toast.error('Erro ao reordenar cursos. Tente novamente.');
    },
  });
};