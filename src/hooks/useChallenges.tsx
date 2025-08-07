import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { useMemo } from 'react';

export const useChallenges = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['challenges', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId) return [];

      // Simplified query - get basic challenge data first
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          id,
          title,
          description,
          challenge_type,
          reward_type,
          reward_value,
          image_url,
          is_active,
          is_available_for_all_levels,
          required_level_id,
          order_index,
          start_date,
          end_date,
          requirements,
          challenge_duration_days,
          challenge_duration_hours,
          deadline_type,
          access_tags
        `)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!currentCompanyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes  
    refetchOnWindowFocus: false,
  });
};

// Separate hook for challenge progress - only load when needed
export const useChallengeWithProgress = (challengeId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['challenge-with-progress', challengeId, user?.id],
    queryFn: async () => {
      if (!challengeId || !user?.id) return null;

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
        .eq('id', challengeId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!challengeId && !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
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
    staleTime: 5 * 60 * 1000, // 5 minutes - rewards don't change frequently
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });
};