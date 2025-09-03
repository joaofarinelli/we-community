import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ReorderLessonsData {
  moduleId: string;
  lessonUpdates: Array<{
    id: string;
    order_index: number;
  }>;
}

export const useReorderLessons = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReorderLessonsData) => {
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Update all lessons in a single transaction
      const updates = data.lessonUpdates.map(update => 
        supabase
          .from('course_lessons')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
      );

      const results = await Promise.all(updates);
      
      // Check for any errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error('Erro ao reordenar aulas');
      }

      return results;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons', variables.moduleId] });
      toast.success('Ordem das aulas atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao reordenar aulas:', error);
      toast.error('Erro ao reordenar aulas. Tente novamente.');
    },
  });
};