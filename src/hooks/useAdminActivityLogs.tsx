import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

interface UseAdminActivityLogsOptions {
  search?: string;
  actionType?: string;
  days?: number;
  customDate?: Date;
  limit?: number;
}

export const useAdminActivityLogs = (options: UseAdminActivityLogsOptions = {}) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const { search = '', actionType, days = 7, customDate, limit = 50 } = options;

  return useQuery({
    queryKey: ['adminActivityLogs', currentCompanyId, search, actionType, days, customDate, limit],
    queryFn: async () => {
      if (!currentCompanyId) return { activities: [], totalCount: 0, stats: null, actionTypes: [] };

      // Base query
      let query = supabase
        .from('point_transactions')
        .select(`
          *,
          profiles:user_id (
            id,
            user_id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('company_id', currentCompanyId);

      // Date filter
      if (customDate) {
        const startOfDay = new Date(customDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(customDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.gte('created_at', startOfDay.toISOString())
                    .lte('created_at', endOfDay.toISOString());
      } else if (days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte('created_at', startDate.toISOString());
      }

      // Action type filter
      if (actionType) {
        query = query.eq('action_type', actionType);
      }

      // Search filter (user name or email)
      if (search) {
        const { data: searchProfiles } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('company_id', currentCompanyId)
          .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);

        if (searchProfiles && searchProfiles.length > 0) {
          const userIds = searchProfiles.map(p => p.user_id);
          query = query.in('user_id', userIds);
        } else {
          // If no users found in search, return empty results
          return { activities: [], totalCount: 0, stats: null, actionTypes: [] };
        }
      }

      // Get total count using a separate query with the same filters
      let countQuery = supabase
        .from('point_transactions')
        .select('id', { count: 'exact' })
        .eq('company_id', currentCompanyId);

      // Apply same filters to count query
      if (customDate) {
        const startOfDay = new Date(customDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(customDate);
        endOfDay.setHours(23, 59, 59, 999);
        countQuery = countQuery.gte('created_at', startOfDay.toISOString())
                              .lte('created_at', endOfDay.toISOString());
      } else if (days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        countQuery = countQuery.gte('created_at', startDate.toISOString());
      }

      if (actionType) {
        countQuery = countQuery.eq('action_type', actionType);
      }

      if (search) {
        const { data: searchProfiles } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('company_id', currentCompanyId)
          .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);

        if (searchProfiles && searchProfiles.length > 0) {
          const userIds = searchProfiles.map(p => p.user_id);
          countQuery = countQuery.in('user_id', userIds);
        }
      }

      const { count } = await countQuery;

      // Get paginated results
      const { data: activities, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get statistics
      const statsQuery = supabase
        .from('point_transactions')
        .select('action_type, points, user_id')
        .eq('company_id', currentCompanyId);

      // Apply same date filter for stats
      if (customDate) {
        const startOfDay = new Date(customDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(customDate);
        endOfDay.setHours(23, 59, 59, 999);
        statsQuery
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString());
      } else if (days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        statsQuery.gte('created_at', startDate.toISOString());
      }

      const { data: statsData } = await statsQuery;

      // Calculate statistics
      let stats = null;
      let actionTypes: string[] = [];

      if (statsData) {
        const totalActivities = statsData.length;
        const totalCoinsDistributed = statsData.reduce((sum, activity) => sum + (activity.points || 0), 0);
        const activeUsers = new Set(statsData.map(activity => activity.user_id)).size;
        
        // Most common activity
        const actionTypeCounts = statsData.reduce((acc, activity) => {
          acc[activity.action_type] = (acc[activity.action_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const mostCommonActivity = Object.entries(actionTypeCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0];

        // Get unique action types for filter
        actionTypes = [...new Set(statsData.map(activity => activity.action_type))].sort();

        stats = {
          totalActivities,
          totalCoinsDistributed,
          activeUsers,
          mostCommonActivity
        };
      }

      return {
        activities: activities || [],
        totalCount: count || 0,
        stats,
        actionTypes
      };
    },
    enabled: !!currentCompanyId,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });
};

// Hook for real-time activity monitoring (optional)
export const useRealtimeActivityLogs = () => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['realtimeActivityLogs', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return [];

      // Get last 10 activities for real-time monitoring
      const { data, error } = await supabase
        .from('point_transactions')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('company_id', currentCompanyId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentCompanyId,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};