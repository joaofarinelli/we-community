import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export const useAccountStats = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['accountStats', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user || !currentCompanyId) return null;

      // Using current company context; no profile lookup needed

      // Get transactions for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: transactions, error } = await supabase
        .from('point_transactions')
        .select('coins, action_type, created_at')
        .eq('user_id', user.id)
        .eq('company_id', currentCompanyId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate stats
      const totalEarned = transactions
        ?.filter(t => t.coins > 0)
        .reduce((sum, t) => sum + t.coins, 0) || 0;

      const totalSpent = transactions
        ?.filter(t => t.coins < 0)
        .reduce((sum, t) => sum + Math.abs(t.coins), 0) || 0;

      const transfersSent = transactions
        ?.filter(t => t.action_type === 'transfer_sent')
        .reduce((sum, t) => sum + Math.abs(t.coins), 0) || 0;

      const transfersReceived = transactions
        ?.filter(t => t.action_type === 'transfer_received')
        .reduce((sum, t) => sum + t.coins, 0) || 0;

      return {
        totalEarned,
        totalSpent,
        transfersSent,
        transfersReceived,
        transactionCount: transactions?.length || 0,
      };
    },
    enabled: !!user && !!currentCompanyId,
  });
};