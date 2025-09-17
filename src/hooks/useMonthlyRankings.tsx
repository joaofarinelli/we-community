import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from './useCompanyContext';

export const useMonthlyRankings = (monthYear?: string, limit: number = 10) => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['monthlyRankings', currentCompanyId, monthYear, limit],
    queryFn: async () => {
      if (!currentCompanyId) return [];

      let query = supabase
        .from('monthly_rankings')
        .select(`
          *,
          profiles!monthly_rankings_user_id_fkey(first_name, last_name, user_id, role)
        `)
        .eq('company_id', currentCompanyId);

      if (monthYear) {
        query = query.eq('month_year', monthYear);
      }

      const { data, error } = await query
        .order('final_rank', { ascending: true })
        .limit(limit);

      if (error) throw error;
      
      // Filter out owners and admins
      const filteredData = (data || []).filter(item => 
        item.profiles && 
        item.profiles.role !== 'owner' && 
        item.profiles.role !== 'admin'
      );
      
      return filteredData;
    },
    enabled: !!currentCompanyId,
    staleTime: 60000, // Cache for 1 minute
  });
};

export const useAvailableMonths = () => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['availableMonths', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return [];

      const { data, error } = await supabase
        .from('monthly_rankings')
        .select('month_year')
        .eq('company_id', currentCompanyId)
        .order('month_year', { ascending: false });

      if (error) throw error;

      // Get unique months
      const uniqueMonths = [...new Set(data?.map(item => item.month_year) || [])];
      return uniqueMonths;
    },
    enabled: !!currentCompanyId,
    staleTime: 300000, // Cache for 5 minutes
  });
};

export const useCurrentMonthProgress = () => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['currentMonthProgress', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return null;

      const { data, error } = await supabase
        .from('user_points')
        .select('last_monthly_reset')
        .eq('company_id', currentCompanyId)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const now = new Date();
      const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const lastReset = data?.last_monthly_reset ? new Date(data.last_monthly_reset) : new Date(now.getFullYear(), now.getMonth(), 1);
      
      const totalDays = Math.ceil((nextReset.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
      const daysPassed = Math.ceil((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, totalDays - daysPassed);

      return {
        lastReset,
        nextReset,
        daysRemaining,
        daysPassed,
        totalDays,
        progressPercentage: Math.min(100, (daysPassed / totalDays) * 100)
      };
    },
    enabled: !!currentCompanyId,
    staleTime: 60000, // Cache for 1 minute
  });
};