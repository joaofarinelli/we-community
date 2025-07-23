import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserCoins = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['userCoins', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;

      const { data: userCoins, error } = await supabase
        .from('user_points')
        .select(`
          *,
          profiles!user_points_user_id_fkey(first_name, last_name)
        `)
        .eq('user_id', targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // If no coins record exists, return 0 coins
      if (!userCoins) {
        return {
          user_id: targetUserId,
          total_coins: 0,
          total_points: 0,
          profiles: null
        };
      }

      return userCoins;
    },
    enabled: !!targetUserId,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });
};

// Keep the old hook for backward compatibility
export const useUserPoints = useUserCoins;