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

      // First, fetch user_points data
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('user_id, monthly_coins, last_monthly_reset')
        .eq('company_id', company.id)
        .order('monthly_coins', { ascending: false })
        .limit(limit);

      if (pointsError) throw pointsError;
      if (!pointsData || pointsData.length === 0) return [];

      // Extract user IDs
      const userIds = pointsData.map(p => p.user_id);

      // Fetch profiles for those users, excluding owners and admins
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, role')
        .eq('company_id', company.id)
        .in('user_id', userIds)
        .not('role', 'in', '("owner","admin")');

      if (profilesError) throw profilesError;

      // Merge the data, only including users who are not owners or admins
      const rankedData = pointsData
        .map((pointsItem, index) => {
          const profile = profilesData?.find(p => p.user_id === pointsItem.user_id);
          return {
            ...pointsItem,
            profiles: profile || { first_name: '', last_name: '', user_id: pointsItem.user_id },
            rank: index + 1
          };
        })
        .filter(item => item.profiles && profilesData?.some(p => p.user_id === item.user_id)); // Only include users that passed the role filter

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

      // Get all user IDs
      const allUserIds = data.map(p => p.user_id);

      // Filter out owners and admins
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, role')
        .eq('company_id', company.id)
        .in('user_id', allUserIds)
        .not('role', 'in', '("owner","admin")');

      if (profilesError) throw profilesError;

      // Filter user points to exclude owners and admins
      const allowedUserIds = new Set(profilesData?.map(p => p.user_id) || []);
      const filteredData = data.filter(item => allowedUserIds.has(item.user_id));

      // Find user's position and get their data
      const userIndex = filteredData.findIndex(item => item.user_id === user.id);
      const userData = userIndex >= 0 ? filteredData[userIndex] : null;

      if (!userData) return { rank: null, total_users: filteredData.length, points: 0, coins: 0, level: null, monthlyCoins: 0, lastReset: null };

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
        total_users: filteredData.length,
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