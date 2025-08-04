import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export const useUserCoins = (userId?: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['userCoins', targetUserId, currentCompanyId],
    queryFn: async () => {
      if (!targetUserId || !currentCompanyId) return null;

      const { data: userCoins, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('company_id', currentCompanyId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      // If no coins record exists, return 0 coins
      if (!userCoins) {
        return {
          user_id: targetUserId,
          company_id: currentCompanyId,
          total_coins: 0,
          total_points: 0,
          profiles: null
        };
      }

      return userCoins;
    },
    enabled: !!targetUserId && !!currentCompanyId,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });
};

// Keep the old hook for backward compatibility
export const useUserPoints = useUserCoins;