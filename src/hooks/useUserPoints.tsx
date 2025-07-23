import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserPoints = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['userPoints', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;

      const { data: userPoints, error } = await supabase
        .from('user_points')
        .select(`
          *,
          profiles(first_name, last_name)
        `)
        .eq('user_id', targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // If no points record exists, return 0 points
      if (!userPoints) {
        return {
          user_id: targetUserId,
          total_points: 0,
          profiles: null
        };
      }

      return userPoints;
    },
    enabled: !!targetUserId,
  });
};