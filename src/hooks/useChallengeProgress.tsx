import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useMemo } from 'react';

// Hook otimizado para buscar progresso de desafios específicos
export const useChallengeProgressBatch = (challengeIds: string[]) => {
  const { user } = useAuth();

  // Estabilizar user ID para evitar mudanças desnecessárias
  const stableUserId = user?.id || '';

  return useQuery({
    queryKey: ['challenge-progress-batch', challengeIds, stableUserId],
    queryFn: async () => {
      // Se não tem user ID ou challengeIds, retorna objeto vazio
      if (!stableUserId || challengeIds.length === 0) return {};

      const { data, error } = await supabase
        .from('challenge_progress')
        .select(`
          challenge_id,
          progress_value,
          target_value,
          is_completed,
          completed_at
        `)
        .eq('user_id', stableUserId)
        .in('challenge_id', challengeIds);

      if (error) throw error;

      // Convert to object for O(1) lookup
      return (data || []).reduce((acc, progress) => {
        acc[progress.challenge_id] = progress;
        return acc;
      }, {} as Record<string, any>);
    },
    enabled: !!stableUserId && challengeIds.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook otimizado para buscar participações de desafios específicos
export const useChallengeParticipationsBatch = (challengeIds: string[]) => {
  const { user } = useAuth();

  // Estabilizar user ID para evitar mudanças desnecessárias
  const stableUserId = user?.id || '';

  return useQuery({
    queryKey: ['challenge-participations-batch', challengeIds, stableUserId],
    queryFn: async () => {
      // Se não tem user ID ou challengeIds, retorna objeto vazio
      if (!stableUserId || challengeIds.length === 0) return {};

      const { data, error } = await supabase
        .from('user_challenge_participations')
        .select(`
          challenge_id,
          status,
          accepted_at,
          expires_at
        `)
        .eq('user_id', stableUserId)
        .in('challenge_id', challengeIds);

      if (error) throw error;

      // Convert to object for O(1) lookup
      return (data || []).reduce((acc, participation) => {
        acc[participation.challenge_id] = participation;
        return acc;
      }, {} as Record<string, any>);
    },
    enabled: !!stableUserId && challengeIds.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook para filtrar desafios por nível do usuário (memoized)
export const useFilteredChallenges = (challenges: any[], userLevel: any) => {
  return useMemo(() => {
    if (!challenges) return { active: [], completed: [] };

    const filtered = challenges.filter(challenge => {
      // If challenge is available for all levels, include it
      if (challenge.is_available_for_all_levels) {
        return true;
      }
      
      // If user doesn't have a level yet, only show all-levels challenges
      if (!userLevel?.user_levels) {
        return false;
      }

      // If challenge has a required level, check if user meets it
      if (challenge.required_level_id) {
        // We'll need to fetch level info separately for performance
        return true; // For now, include all
      }

      return true;
    });

    return filtered;
  }, [challenges, userLevel]);
};