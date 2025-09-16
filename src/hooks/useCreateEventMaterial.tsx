import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

interface CreateEventMaterialData {
  eventId: string;
  title: string;
  description?: string;
  file: File;
  isVisibleToParticipants?: boolean;
}

export const useCreateEventMaterial = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEventMaterialData) => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      // Upload file to storage
      const fileExt = data.file.name.split('.').pop();
      const fileName = `${user.id}/${data.eventId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('event-materials')
        .upload(fileName, data.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('event-materials')
        .getPublicUrl(uploadData.path);

      // Create material record
      const { data: material, error } = await supabase
        .from('event_materials')
        .insert({
          event_id: data.eventId,
          title: data.title,
          description: data.description,
          file_url: publicUrl,
          file_name: data.file.name,
          file_type: data.file.type,
          file_size: data.file.size,
          uploaded_by: user.id,
          is_visible_to_participants: data.isVisibleToParticipants || false,
        })
        .select()
        .single();

      if (error) throw error;
      return material;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['eventMaterials', variables.eventId] });
      toast.success('Material adicionado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao adicionar material');
    },
  });
};