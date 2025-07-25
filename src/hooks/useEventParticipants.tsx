import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

export const useEventParticipants = (eventId: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const participantsQuery = useQuery({
    queryKey: ['eventParticipants', eventId, user?.id],
    queryFn: async () => {
      if (!user || !eventId) return [];

      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          *,
          profiles(first_name, last_name)
        `)
        .eq('event_id', eventId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!eventId,
  });

  const joinEvent = useMutation({
    mutationFn: async () => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: user.id,
          company_id: currentCompanyId,
          status: 'confirmed'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventParticipants', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['allUserEvents'] });
      toast.success('Você se inscreveu no evento!');
    },
    onError: () => {
      toast.error('Erro ao se inscrever no evento');
    },
  });

  const leaveEvent = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventParticipants', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['allUserEvents'] });
      toast.success('Você saiu do evento');
    },
    onError: () => {
      toast.error('Erro ao sair do evento');
    },
  });

  return {
    participants: participantsQuery.data || [],
    isLoading: participantsQuery.isLoading,
    joinEvent,
    leaveEvent,
    isJoining: joinEvent.isPending,
    isLeaving: leaveEvent.isPending,
  };
};