import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

export const useEventLikes = (eventId: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const { data: likes = [], isLoading } = useQuery({
    queryKey: ['eventLikes', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('event_likes')
        .select('*')
        .eq('event_id', eventId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });

  const { data: userLike } = useQuery({
    queryKey: ['eventLike', eventId, user?.id],
    queryFn: async () => {
      if (!user || !eventId) return null;

      const { data, error } = await supabase
        .from('event_likes')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!eventId,
  });

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      if (userLike) {
        // Remove like
        const { error } = await supabase
          .from('event_likes')
          .delete()
          .eq('id', userLike.id);

        if (error) throw error;
      } else {
        // Add like
        const { error } = await supabase
          .from('event_likes')
          .insert({
            event_id: eventId,
            user_id: user.id,
            company_id: currentCompanyId,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventLikes', eventId] });
      queryClient.invalidateQueries({ queryKey: ['eventLike', eventId, user?.id] });
    },
    onError: () => {
      toast.error('Erro ao curtir evento');
    },
  });

  return {
    likes,
    userLike: !!userLike,
    likesCount: likes.length,
    toggleLike,
    isLoading,
  };
};