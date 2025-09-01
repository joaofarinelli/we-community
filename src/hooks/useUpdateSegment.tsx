import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

interface UpdateSegmentData {
  name?: string;
  description?: string;
  color?: string;
  is_active?: boolean;
}

export const useUpdateSegment = () => {
  const queryClient = useQueryClient();
  const { currentCompanyId } = useCompanyContext();

  return useMutation({
    mutationFn: async ({ segmentId, data }: { segmentId: string; data: UpdateSegmentData }) => {
      const { error } = await supabase
        .from('segments')
        .update(data)
        .eq('id', segmentId)
        .eq('company_id', currentCompanyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments', currentCompanyId] });
      toast.success('Segmento atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar segmento:', error);
      toast.error('Erro ao atualizar segmento. Tente novamente.');
    },
  });
};