import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from './useCompanyContext';

interface LastPlacedUser {
  user_id: string;
  final_rank: number;
  monthly_coins: number;
  profiles: {
    first_name: string;
    last_name: string;
    user_id: string;
  } | null;
}

export const useLastPlacedUsers = () => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['lastPlacedUsers', currentCompanyId],
    queryFn: async (): Promise<LastPlacedUser[]> => {
      if (!currentCompanyId) return [];

      // Get previous month in YYYY-MM format
      const previousMonth = new Date();
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      const monthYear = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;

      // First get the monthly rankings
      const { data: rankings, error: rankingsError } = await supabase
        .from('monthly_rankings')
        .select('user_id, final_rank, monthly_coins')
        .eq('company_id', currentCompanyId)
        .eq('month_year', monthYear)
        .order('final_rank', { ascending: false })
        .limit(3);

      if (rankingsError) throw rankingsError;
      if (!rankings || rankings.length === 0) return [];

      // Then get the profiles for those users
      const userIds = rankings.map(r => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .eq('company_id', currentCompanyId)
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const result: LastPlacedUser[] = rankings.map(ranking => {
        const profile = profiles?.find(p => p.user_id === ranking.user_id);
        return {
          user_id: ranking.user_id,
          final_rank: ranking.final_rank,
          monthly_coins: ranking.monthly_coins,
          profiles: profile || null
        };
      });

      return result;
    },
    enabled: !!currentCompanyId,
    staleTime: 300000, // Cache for 5 minutes
  });
};