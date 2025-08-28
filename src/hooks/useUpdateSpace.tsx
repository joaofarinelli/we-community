import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UpdateSpaceData {
  id: string;
  name?: string;
  description?: string;
  visibility?: 'public' | 'private' | 'secret';
  category_id?: string | null;
  is_private?: boolean;
  custom_icon_type?: 'default' | 'emoji' | 'image';
  custom_icon_value?: string;
}

export const useUpdateSpace = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSpaceData) => {
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const { id, ...updateData } = data;
      
      const { data: updatedSpace, error } = await supabase
        .from('spaces')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedSpace;
    },
    onSuccess: (updatedSpace) => {
      queryClient.invalidateQueries({ queryKey: ['space', updatedSpace.id] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      toast.success('Espaço atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar espaço:', error);
      toast.error('Erro ao atualizar espaço. Tente novamente.');
    },
  });
};