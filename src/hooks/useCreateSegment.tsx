import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from './useCompanyContext';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface CreateSegmentData {
  name: string;
  description?: string;
  color?: string;
}

export const useCreateSegment = () => {
  const queryClient = useQueryClient();
  const { currentCompanyId } = useCompanyContext();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateSegmentData) => {
      if (!currentCompanyId || !user) {
        throw new Error('Dados necessários não encontrados');
      }

      const { error } = await supabase
        .from('segments')
        .insert({
          company_id: currentCompanyId,
          created_by: user.id,
          name: data.name,
          description: data.description,
          color: data.color || '#3B82F6'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments', currentCompanyId] });
      toast.success('Segmento criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar segmento:', error);
      toast.error('Erro ao criar segmento. Tente novamente.');
    },
  });
};