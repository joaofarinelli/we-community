import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

interface CreateEventData {
  spaceId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  maxParticipants?: number;
  imageUrl?: string;
}

export const useCreateEvent = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEventData) => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('events')
        .insert({
          space_id: data.spaceId,
          company_id: currentCompanyId,
          title: data.title,
          description: data.description,
          start_date: data.startDate.toISOString(),
          end_date: data.endDate.toISOString(),
          location: data.location,
          max_participants: data.maxParticipants,
          image_url: data.imageUrl,
          created_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events', variables.spaceId] });
      queryClient.invalidateQueries({ queryKey: ['allUserEvents'] });
      toast.success('Evento criado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar evento');
    },
  });
};