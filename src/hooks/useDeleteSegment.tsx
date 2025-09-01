import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

export const useDeleteSegment = () => {
  const queryClient = useQueryClient();
  const { currentCompanyId } = useCompanyContext();

  return useMutation({
    mutationFn: async (segmentId: string) => {
      const { error } = await supabase
        .from('segments')
        .update({ is_active: false })
        .eq('id', segmentId)
        .eq('company_id', currentCompanyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments', currentCompanyId] });
      toast.success('Segmento deletado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao deletar segmento:', error);
      toast.error('Erro ao deletar segmento. Tente novamente.');
    },
  });
};