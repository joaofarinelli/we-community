import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useAccountStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['accountStats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get user's company ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return null;

      // Get transactions for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: transactions, error } = await supabase
        .from('point_transactions')
        .select('coins, action_type, created_at')
        .eq('user_id', user.id)
        .eq('company_id', profile.company_id)
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
    enabled: !!user,
  });
};