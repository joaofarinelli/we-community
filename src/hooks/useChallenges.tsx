import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useChallenges = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          challenge_progress!left(
            id,
            progress_value,
            target_value,
            is_completed,
            completed_at
          )
        `)
        .eq('challenge_progress.user_id', user.id)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

export const useChallengeProgress = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['challenge-progress', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('challenge_progress')
        .select(`
          *,
          challenges!inner(
            id,
            title,
            description,
            challenge_type,
            reward_type,
            reward_value
          )
        `)
        .eq('user_id', targetUserId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!targetUserId,
  });
};

export const useChallengeRewards = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['challenge-rewards', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('challenge_rewards')
        .select(`
          *,
          challenges!inner(
            title,
            description
          )
        `)
        .eq('user_id', user.id)
        .order('claimed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};