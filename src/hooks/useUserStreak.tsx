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
      if (!user?.id || !currentCompanyId) {
        console.log('❌ useUserStreak: Missing user or company', { userId: user?.id, companyId: currentCompanyId });
        return null;
      }

      // First get the profile ID for this user in this company
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', currentCompanyId)
        .single();

      if (profileError || !profile) {
        console.error('❌ useUserStreak: Profile not found', profileError);
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

      // Ensure context is set before querying
      try {
        await supabase.rpc('set_current_company_context', {
          p_company_id: currentCompanyId
        });
        console.log('✅ useUserStreak: Context set for query', currentCompanyId);
      } catch (contextError) {
        console.error('❌ useUserStreak: Failed to set context', contextError);
        throw new Error('Failed to set company context for streak query');
      }

      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', profile.id)
        .eq('company_id', currentCompanyId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ useUserStreak: Query error', error);
        throw error;
      }
      
      // If no streak record exists, return default values
      if (!data) {
        console.log('✅ useUserStreak: No streak record found, returning defaults');
        return {
          user_id: profile.id,
          company_id: currentCompanyId,
          current_streak: 0,
          longest_streak: 0,
          last_activity_date: null,
          streak_start_date: null,
          is_active: false
        };
      }

      console.log('✅ useUserStreak: Retrieved streak data', data);
      return data;
    },
    enabled: !!user?.id && !!currentCompanyId,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });

  const updateStreakMutation = useMutation({
    mutationFn: async () => {
      console.log('updateStreakMutation called - user:', user?.id, 'company:', currentCompanyId);
      if (!user?.id || !currentCompanyId) {
        console.error('Missing user or company ID', { userId: user?.id, companyId: currentCompanyId });
        throw new Error('User or company not found');
      }

      // First, ensure the Supabase context is set correctly for multi-company
      try {
        await supabase.rpc('set_current_company_context', {
          p_company_id: currentCompanyId
        });
        console.log('✅ Context set for streak update, company:', currentCompanyId);
      } catch (contextError) {
        console.error('❌ Failed to set context for streak update:', contextError);
        throw new Error('Failed to set company context');
      }

      console.log('Calling update_user_streak RPC with params:', { p_user_id: user.id, p_company_id: currentCompanyId });
      const { error } = await supabase.rpc('update_user_streak', {
        p_user_id: user.id,
        p_company_id: currentCompanyId
      });

      if (error) {
        console.error('RPC update_user_streak error:', error);
        throw error;
      }
      console.log('update_user_streak completed successfully');
    },
    onSuccess: () => {
      console.log('updateStreakMutation onSuccess - invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['userStreak'] });
      queryClient.invalidateQueries({ queryKey: ['userCoins'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.error('updateStreakMutation onError:', error);
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

  const needsCheckInToday = () => {
    if (!streakQuery.data) return false;
    
    const today = new Date().toDateString();
    const lastActivity = streakQuery.data.last_activity_date 
      ? new Date(streakQuery.data.last_activity_date).toDateString()
      : null;
    
    return lastActivity !== today;
  };

  return {
    streak: streakQuery.data,
    isLoading: streakQuery.isLoading,
    error: streakQuery.error,
    checkInToday,
    isUpdating: updateStreakMutation.isPending,
    needsCheckInToday,
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
        .select(`
          *,
          profiles!inner(
            user_id,
            first_name,
            last_name,
            role
          )
        `)
        .eq('company_id', currentCompanyId)
        .eq('is_active', true)
        .not('profiles.role', 'in', '(owner,admin)')
        .order('current_streak', { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!streakData?.length) return [];

      return streakData;
    },
    enabled: !!currentCompanyId,
    staleTime: 60000, // Cache for 1 minute
  });
};