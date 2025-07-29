import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

interface UpdateEventData {
  id: string;
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  maxParticipants?: number;
  imageUrl?: string;
  status?: 'draft' | 'active';
  locationType?: string;
  locationAddress?: string;
  onlineLink?: string;
  locationCoordinates?: string;
}

export const useUpdateEvent = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateEventData) => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      const updateData: any = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.startDate !== undefined) updateData.start_date = data.startDate.toISOString();
      if (data.endDate !== undefined) updateData.end_date = data.endDate.toISOString();
      if (data.location !== undefined) updateData.location = data.location;
      if (data.maxParticipants !== undefined) updateData.max_participants = data.maxParticipants;
      if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.locationType !== undefined) updateData.location_type = data.locationType;
      if (data.locationAddress !== undefined) updateData.location_address = data.locationAddress;
      if (data.onlineLink !== undefined) updateData.online_link = data.onlineLink;
      if (data.locationCoordinates !== undefined) updateData.location_coordinates = data.locationCoordinates;

      const { data: event, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', data.id)
        .eq('company_id', currentCompanyId)
        .select()
        .single();

      if (error) throw error;
      return event;
    },
    onSuccess: (_, variables) => {
      // Invalidate events queries for the space
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['allUserEvents'] });
      toast.success('Evento atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar evento');
    },
  });
};