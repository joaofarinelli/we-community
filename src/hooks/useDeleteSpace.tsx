import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useDeleteSpace = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (spaceId: string) => {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('spaces')
        .delete()
        .eq('id', spaceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['userSpaces'] });
      queryClient.invalidateQueries({ queryKey: ['userMemberSpaces'] });
      toast.success('Espaço deletado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao deletar espaço:', error);
      toast.error(error.message || 'Erro ao deletar espaço. Tente novamente.');
    },
  });
};