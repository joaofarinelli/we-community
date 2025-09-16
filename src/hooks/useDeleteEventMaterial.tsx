import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface DeleteEventMaterialData {
  id: string;
  eventId: string;
  fileUrl: string;
}

export const useDeleteEventMaterial = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DeleteEventMaterialData) => {
      if (!user) throw new Error('User not authenticated');

      // Extract file path from URL
      const filePath = data.fileUrl.split('/').slice(-3).join('/');
      
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('event-materials')
        .remove([filePath]);

      if (storageError) {
        console.warn('Failed to delete file from storage:', storageError);
      }

      // Delete material record
      const { error } = await supabase
        .from('event_materials')
        .delete()
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['eventMaterials', variables.eventId] });
      toast.success('Material removido com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover material');
    },
  });
};