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
    queryKey: ['eventParticipants', eventId, user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user || !eventId || !currentCompanyId) {
        console.log('Missing dependencies:', { user: !!user, eventId, currentCompanyId });
        return [];
      }

      console.log('Fetching participants for event:', eventId, 'company:', currentCompanyId);
      
      // First, get the event participants
      const { data: participants, error: participantsError } = await supabase
        .from('event_participants')
        .select('*')
        .eq('event_id', eventId)
        .eq('company_id', currentCompanyId)
        .order('joined_at', { ascending: true });

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        throw participantsError;
      }

      if (!participants || participants.length === 0) {
        return [];
      }

      // Then, get the profile information for those participants
      const userIds = participants.map(p => p.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds)
        .eq('company_id', currentCompanyId);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Return participants without profile info if profiles query fails
        return participants;
      }

      // Combine participants with their profile information
      const participantsWithProfiles = participants.map(participant => {
        const profile = profiles?.find(p => p.user_id === participant.user_id);
        return {
          ...participant,
          profiles: profile ? {
            first_name: profile.first_name,
            last_name: profile.last_name
          } : null
        };
      });

      return participantsWithProfiles;
    },
    enabled: !!user && !!eventId && !!currentCompanyId,
  });

  const joinEvent = useMutation({
    mutationFn: async () => {
      if (!user || !currentCompanyId) {
        console.error('Missing authentication data:', { user: !!user, currentCompanyId });
        throw new Error('User not authenticated or company context missing');
      }

      console.log('Joining event:', eventId, 'user:', user.id, 'company:', currentCompanyId);

      // Use upsert to handle duplicate entries gracefully
      const { error } = await supabase
        .from('event_participants')
        .upsert({
          event_id: eventId,
          user_id: user.id,
          company_id: currentCompanyId,
          status: 'confirmed'
        }, {
          onConflict: 'event_id,user_id'
        });

      if (error) {
        console.error('Error joining event:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventParticipants', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['allUserEvents'] });
      toast.success('Você se inscreveu no evento!');
    },
    onError: (error) => {
      console.error('Error joining event:', error);
      toast.error('Erro ao se inscrever no evento');
    },
  });

  const leaveEvent = useMutation({
    mutationFn: async () => {
      if (!user || !currentCompanyId) {
        console.error('Missing authentication data:', { user: !!user, currentCompanyId });
        throw new Error('User not authenticated or company context missing');
      }

      console.log('Leaving event:', eventId, 'user:', user.id, 'company:', currentCompanyId);

      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .eq('company_id', currentCompanyId);

      if (error) {
        console.error('Error leaving event:', error);
        throw error;
      }
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