import { useQuery } from '@tanstack/react-query';
import { useCompanyContext } from './useCompanyContext';
import { supabase } from '@/integrations/supabase/client';

interface PaymentTransactionsParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface PaymentTransaction {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  user_id: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface PaymentTransactionsResponse {
  data: PaymentTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const usePaymentTransactions = (params: PaymentTransactionsParams = {}) => {
  const { currentCompanyId } = useCompanyContext();
  const { search, status, page = 1, limit = 20 } = params;

  return useQuery({
    queryKey: ['payment-transactions', currentCompanyId, search, status, page, limit],
    queryFn: async (): Promise<PaymentTransactionsResponse> => {
      if (!currentCompanyId) throw new Error('No company selected');

      let query = supabase
        .from('payments')
        .select('*', { count: 'exact' })
        .eq('company_id', currentCompanyId);

      // Apply filters
      if (search) {
        query = query.or(`payer_name.ilike.%${search}%,payer_email.ilike.%${search}%,id.ilike.%${search}%`);
      }

      if (status) {
        query = query.eq('status', status);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Order by created_at desc
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
        },
      };
    },
    enabled: !!currentCompanyId,
  });
};