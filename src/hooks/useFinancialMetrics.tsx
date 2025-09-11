import { useQuery } from '@tanstack/react-query';
import { useCompanyContext } from './useCompanyContext';
import { supabase } from '@/integrations/supabase/client';

interface FinancialMetrics {
  totalRevenue: number;
  totalTransactions: number;
  averageTicket: number;
  conversionRate: number;
  revenueTrend: number;
  transactionsTrend: number;
  ticketTrend: number;
  conversionTrend: number;
  revenueChart: Array<{ date: string; revenue: number }>;
  paymentMethodDistribution: Array<{ name: string; value: number }>;
}

export const useFinancialMetrics = (period?: string) => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['financial-metrics', currentCompanyId, period],
    queryFn: async (): Promise<FinancialMetrics> => {
      if (!currentCompanyId) throw new Error('No company selected');

      // Get current month data
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      // Get previous month for comparison
      const startOfPrevMonth = new Date(startOfMonth);
      startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);
      
      const endOfPrevMonth = new Date(startOfMonth);
      endOfPrevMonth.setDate(0);
      endOfPrevMonth.setHours(23, 59, 59, 999);

      // Fetch current month payments
      const { data: currentPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('company_id', currentCompanyId)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString());

      // Fetch previous month payments for trends
      const { data: previousPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('company_id', currentCompanyId)
        .gte('created_at', startOfPrevMonth.toISOString())
        .lte('created_at', endOfPrevMonth.toISOString());

      // Calculate current metrics
      const paidCurrentPayments = currentPayments?.filter(p => p.status === 'paid') || [];
      const totalRevenue = paidCurrentPayments.reduce((sum, p) => sum + p.amount_cents, 0) / 100;
      const totalTransactions = paidCurrentPayments.length;
      const averageTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      const conversionRate = currentPayments?.length > 0 ? (paidCurrentPayments.length / currentPayments.length) * 100 : 0;

      // Calculate previous metrics for trends
      const paidPreviousPayments = previousPayments?.filter(p => p.status === 'paid') || [];
      const prevTotalRevenue = paidPreviousPayments.reduce((sum, p) => sum + p.amount_cents, 0) / 100;
      const prevTotalTransactions = paidPreviousPayments.length;
      const prevAverageTicket = prevTotalTransactions > 0 ? prevTotalRevenue / prevTotalTransactions : 0;
      const prevConversionRate = previousPayments?.length > 0 ? (paidPreviousPayments.length / previousPayments.length) * 100 : 0;

      // Calculate trends
      const revenueTrend = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0;
      const transactionsTrend = prevTotalTransactions > 0 ? ((totalTransactions - prevTotalTransactions) / prevTotalTransactions) * 100 : 0;
      const ticketTrend = prevAverageTicket > 0 ? ((averageTicket - prevAverageTicket) / prevAverageTicket) * 100 : 0;
      const conversionTrend = prevConversionRate > 0 ? ((conversionRate - prevConversionRate) / prevConversionRate) * 100 : 0;

      // Generate revenue chart data (last 30 days)
      const revenueChart = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const dayPayments = paidCurrentPayments.filter(p => {
          const paymentDate = new Date(p.created_at);
          return paymentDate >= dayStart && paymentDate <= dayEnd;
        });

        const dayRevenue = dayPayments.reduce((sum, p) => sum + p.amount_cents, 0) / 100;
        
        revenueChart.push({
          date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          revenue: dayRevenue,
        });
      }

      // Payment method distribution - using 'boleto' for all since that's what we have
      const paymentMethodDistribution = [
        {
          name: 'Boleto',
          value: currentPayments?.length || 0,
        },
      ];

      return {
        totalRevenue,
        totalTransactions,
        averageTicket,
        conversionRate,
        revenueTrend,
        transactionsTrend,
        ticketTrend,
        conversionTrend,
        revenueChart,
        paymentMethodDistribution,
      };
    },
    enabled: !!currentCompanyId,
  });
};