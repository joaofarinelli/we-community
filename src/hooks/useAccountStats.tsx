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

      // Fetch all transactions for the user/company (lifetime)
      const { data: transactions, error } = await supabase
        .from('point_transactions')
        .select('coins, action_type, created_at')
        .eq('user_id', user.id)
        .eq('company_id', currentCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Lifetime totals
      const totalIn = transactions
        ?.filter(t => t.coins > 0)
        .reduce((sum, t) => sum + t.coins, 0) || 0;

      const totalOut = transactions
        ?.filter(t => t.coins < 0)
        .reduce((sum, t) => sum + Math.abs(t.coins), 0) || 0;

      // Last 30 days metrics (for header trend)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recent = transactions?.filter(t => new Date(t.created_at) >= thirtyDaysAgo) || [];

      const totalEarned = recent
        .filter(t => t.coins > 0)
        .reduce((sum, t) => sum + t.coins, 0) || 0;

      const totalSpent = recent
        .filter(t => t.coins < 0)
        .reduce((sum, t) => sum + Math.abs(t.coins), 0) || 0;

      const transfersSent = transactions
        ?.filter(t => t.action_type === 'transfer_sent')
        .reduce((sum, t) => sum + Math.abs(t.coins), 0) || 0;

      const transfersReceived = transactions
        ?.filter(t => t.action_type === 'transfer_received')
        .reduce((sum, t) => sum + t.coins, 0) || 0;

      return {
        totalIn,
        totalOut,
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