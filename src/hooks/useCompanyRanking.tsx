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

      // Get user's current points first
      const { data: userPoints } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!userPoints) return { rank: null, total_users: 0, points: 0 };

      // Use a more efficient approach with count aggregation
      const { count: usersAhead } = await supabase
        .from('user_points')
        .select('*', { count: 'exact', head: true })
        .gt('total_points', userPoints.total_points);

      const { count: totalUsers } = await supabase
        .from('user_points')
        .select('*', { count: 'exact', head: true });

      return {
        rank: (usersAhead || 0) + 1,
        total_users: totalUsers || 0,
        points: userPoints.total_points
      };
    },
    enabled: !!user,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });
};