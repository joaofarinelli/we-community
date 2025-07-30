import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from '@/hooks/use-toast';

export const useUserStreak = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const streakQuery = useQuery({
    queryKey: ['userStreak', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId) return null;

      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .eq('company_id', currentCompanyId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // If no streak record exists, return default values
      if (!data) {
        return {
          user_id: user.id,
          company_id: currentCompanyId,
          current_streak: 0,
          longest_streak: 0,
          last_activity_date: null,
          streak_start_date: null,
          is_active: false
        };
      }

      return data;
    },
    enabled: !!user?.id && !!currentCompanyId,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });

  const updateStreakMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !currentCompanyId) throw new Error('User or company not found');

      const { error } = await supabase.rpc('update_user_streak', {
        p_user_id: user.id,
        p_company_id: currentCompanyId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userStreak'] });
      queryClient.invalidateQueries({ queryKey: ['userCoins'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.error('Error updating streak:', error);
      toast({
        title: 'Erro ao atualizar ofensiva',
        description: 'Não foi possível atualizar sua ofensiva.',
        variant: 'destructive',
      });
    }
  });

  const checkInToday = () => {
    updateStreakMutation.mutate();
  };

  return {
    streak: streakQuery.data,
    isLoading: streakQuery.isLoading,
    error: streakQuery.error,
    checkInToday,
    isUpdating: updateStreakMutation.isPending,
  };
};

export const useCompanyStreakLeaderboard = (limit: number = 10) => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['streakLeaderboard', currentCompanyId, limit],
    queryFn: async () => {
      if (!currentCompanyId) return [];

      const { data: streakData, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('company_id', currentCompanyId)
        .eq('is_active', true)
        .order('current_streak', { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!streakData?.length) return [];

      // Get user profiles separately
      const userIds = streakData.map(streak => streak.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds)
        .eq('company_id', currentCompanyId);

      if (profilesError) throw profilesError;

      // Combine the data
      const data = streakData.map(streak => ({
        ...streak,
        profiles: profilesData?.find(profile => profile.user_id === streak.user_id) || null
      }));

      return data;
    },
    enabled: !!currentCompanyId,
    staleTime: 60000, // Cache for 1 minute
  });
};