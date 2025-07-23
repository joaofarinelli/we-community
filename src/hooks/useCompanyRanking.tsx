import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useCompanyRanking = (limit: number = 10) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['companyRanking', limit, user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_points')
        .select(`
          *,
          profiles!user_points_user_id_fkey(first_name, last_name, user_id)
        `)
        .order('total_points', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Add ranking position to each user
      const rankedData = data?.map((user, index) => ({
        ...user,
        rank: index + 1
      })) || [];

      return rankedData;
    },
    enabled: !!user,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });
};

export const useUserRankingPosition = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userRankingPosition', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get user's current coins and level
      const { data: userLevel } = await supabase
        .from('user_current_level')
        .select(`
          current_coins,
          user_levels(level_name, level_color, level_icon, level_number)
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!userLevel) return { rank: null, total_users: 0, points: 0, coins: 0, level: null };

      // Use a more efficient approach with count aggregation
      const { count: usersAhead } = await supabase
        .from('user_current_level')
        .select('*', { count: 'exact', head: true })
        .gt('current_coins', userLevel.current_coins);

      const { count: totalUsers } = await supabase
        .from('user_current_level')
        .select('*', { count: 'exact', head: true });

      return {
        rank: (usersAhead || 0) + 1,
        total_users: totalUsers || 0,
        points: userLevel.current_coins, // For backward compatibility
        coins: userLevel.current_coins,
        level: userLevel.user_levels
      };
    },
    enabled: !!user,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });
};