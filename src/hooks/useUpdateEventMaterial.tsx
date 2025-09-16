import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UpdateEventMaterialData {
  id: string;
  eventId: string;
  title?: string;
  description?: string;
  isVisibleToParticipants?: boolean;
}

export const useUpdateEventMaterial = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateEventMaterialData) => {
      if (!user) throw new Error('User not authenticated');

      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.isVisibleToParticipants !== undefined) updateData.is_visible_to_participants = data.isVisibleToParticipants;

      const { data: material, error } = await supabase
        .from('event_materials')
        .update(updateData)
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return material;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['eventMaterials', variables.eventId] });
      toast.success('Material atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar material');
    },
  });
};