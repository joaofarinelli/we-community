import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserLevel } from './useUserLevel';

export const useChallenges = () => {
  const { user } = useAuth();
  const { data: userLevel } = useUserLevel();

  return useQuery({
    queryKey: ['challenges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          required_level:user_levels!challenges_required_level_id_fkey(
            level_number,
            level_name
          ),
          challenge_progress!left(
            id,
            progress_value,
            target_value,
            is_completed,
            completed_at
          ),
          user_challenge_participations!left(
            id,
            status,
            accepted_at,
            expires_at
          )
        `)
        .eq('challenge_progress.user_id', user.id)
        .eq('user_challenge_participations.user_id', user.id)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Filter challenges based on user level
      const filteredChallenges = data?.filter(challenge => {
        // If challenge is available for all levels, include it
        if (challenge.is_available_for_all_levels) {
          return true;
        }
        
        // If user doesn't have a level yet, only show all-levels challenges
        if (!userLevel?.user_levels) {
          return false;
        }

        // If challenge has a required level, check if user meets it
        if (challenge.required_level_id && challenge.required_level) {
          return userLevel.user_levels.level_number >= challenge.required_level.level_number;
        }

        return true;
      }) || [];
      
      return filteredChallenges;
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