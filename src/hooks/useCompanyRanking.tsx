import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';

export const useCompanyRanking = (limit: number = 10) => {
  const { user } = useAuth();
  const { data: company } = useCompany();

  return useQuery({
    queryKey: ['companyRanking', limit, company?.id],
    queryFn: async () => {
      if (!user || !company?.id) return [];

      const { data, error } = await supabase
        .from('user_points')
        .select(`
          *,
          profiles!user_points_user_id_fkey(first_name, last_name, user_id)
        `)
        .eq('company_id', company.id)
        .order('monthly_coins', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Add ranking position to each user
      const rankedData = data?.map((user, index) => ({
        ...user,
        rank: index + 1
      })) || [];

      return rankedData;
    },
    enabled: !!user && !!company?.id,
    staleTime: 60000, // Cache for 60 seconds
    refetchOnWindowFocus: false,
  });
};

export const useUserRankingPosition = () => {
  const { user } = useAuth();
  const { data: company } = useCompany();

  return useQuery({
    queryKey: ['userRankingPosition', user?.id, company?.id],
    queryFn: async () => {
      if (!user || !company?.id) return null;

      // Single optimized query using window function to get rank and total users
      // Get user points with monthly coins for ranking
      const { data, error } = await supabase
        .from('user_points')
        .select(`
          monthly_coins,
          user_id,
          last_monthly_reset
        `)
        .eq('company_id', company.id)
        .order('monthly_coins', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return { rank: null, total_users: 0, points: 0, coins: 0, level: null, monthlyCoins: 0, lastReset: null };

      // Find user's position and get their data
      const userIndex = data.findIndex(item => item.user_id === user.id);
      const userData = userIndex >= 0 ? data[userIndex] : null;

      if (!userData) return { rank: null, total_users: data.length, points: 0, coins: 0, level: null, monthlyCoins: 0, lastReset: null };

      // Get user's level information separately
      const { data: levelData } = await supabase
        .from('user_current_level')
        .select(`
          current_coins,
          user_levels(level_name, level_color, level_icon, level_number)
        `)
        .eq('company_id', company.id)
        .eq('user_id', user.id)
        .single();

      return {
        rank: userIndex + 1,
        total_users: data.length,
        points: userData.monthly_coins, // For backward compatibility
        coins: levelData?.current_coins || 0, // Total coins for levels/store
        monthlyCoins: userData.monthly_coins, // Monthly coins for ranking
        level: levelData?.user_levels || null,
        lastReset: userData.last_monthly_reset
      };
    },
    enabled: !!user && !!company?.id,
    staleTime: 60000, // Cache for 60 seconds
    refetchOnWindowFocus: false,
  });
};