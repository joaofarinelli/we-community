import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserLevel = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['userLevel', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;

      const { data: userLevel, error } = await supabase
        .from('user_current_level')
        .select(`
          *,
          user_levels(
            id,
            level_name,
            level_color,
            level_icon,
            level_number,
            min_coins_required,
            max_coins_required
          )
        `)
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error) throw error;

      if (!userLevel) return null;

      // Get next level
      const { data: nextLevel } = await supabase
        .from('user_levels')
        .select('*')
        .eq('company_id', userLevel.company_id)
        .gt('level_number', userLevel.user_levels?.level_number || 0)
        .order('level_number', { ascending: true })
        .limit(1)
        .maybeSingle();

      // Calculate progress to next level
      let progressPercentage = 100;
      let coinsToNext = 0;

      if (nextLevel) {
        const currentLevelMin = userLevel.user_levels?.min_coins_required || 0;
        const nextLevelMin = nextLevel.min_coins_required;
        const range = nextLevelMin - currentLevelMin;
        const progress = userLevel.current_coins - currentLevelMin;
        progressPercentage = Math.min(100, Math.max(0, (progress / range) * 100));
        coinsToNext = Math.max(0, nextLevelMin - userLevel.current_coins);
      }

      return {
        ...userLevel,
        next_level: nextLevel,
        progress_percentage: progressPercentage,
        coins_to_next_level: coinsToNext
      };
    },
    enabled: !!targetUserId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
};