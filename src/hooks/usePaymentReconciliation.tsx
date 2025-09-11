import { useQuery } from '@tanstack/react-query';
import { useCompanyContext } from './useCompanyContext';
import { supabase } from '@/integrations/supabase/client';

interface ReconciliationSummary {
  pending: number;
  divergent: number;
  reconciled: number;
}

interface ReconciliationPayment {
  id: string;
  amount_cents: number;
  status: string;
  payer_name: string;
  user_id: string;
  created_at: string;
  reconciliationStatus: 'pending' | 'divergent' | 'reconciled';
  reconciliationNotes?: string;
}

interface PaymentReconciliation {
  summary: ReconciliationSummary;
  payments: ReconciliationPayment[];
  lastSync?: string;
}

export const usePaymentReconciliation = () => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['payment-reconciliation', currentCompanyId],
    queryFn: async (): Promise<PaymentReconciliation> => {
      if (!currentCompanyId) throw new Error('No company selected');

      // Get all payments that need reconciliation (pending or potentially divergent)
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('company_id', currentCompanyId)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false });

      if (!payments) throw new Error('Unable to fetch payments');

      // Simulate reconciliation logic - in a real implementation, 
      // this would check against external payment provider's API
      const reconciliationPayments: ReconciliationPayment[] = payments.map(payment => {
        // Simulate different reconciliation statuses
        let reconciliationStatus: 'pending' | 'divergent' | 'reconciled' = 'pending';
        let reconciliationNotes = '';

        // Check if payment is older than 3 days and still pending
        const paymentDate = new Date(payment.created_at);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        if (paymentDate < threeDaysAgo && payment.status === 'pending') {
          reconciliationStatus = 'divergent';
          reconciliationNotes = 'Pagamento pendente há mais de 3 dias';
        }

        // Check for expired boletos
        if (payment.boleto_expiration) {
          const dueDate = new Date(payment.boleto_expiration);
          if (dueDate < new Date() && payment.status === 'pending') {
            reconciliationStatus = 'divergent';
            reconciliationNotes = 'Boleto vencido';
          }
        }

        return {
          id: payment.id,
          amount_cents: payment.amount_cents,
          status: payment.status,
          payer_name: `Usuário ${payment.user_id.slice(-8)}`, // Since we don't have payer_name, use user_id
          user_id: payment.user_id,
          created_at: payment.created_at,
          reconciliationStatus,
          reconciliationNotes,
        };
      });

      // Calculate summary
      const summary: ReconciliationSummary = {
        pending: reconciliationPayments.filter(p => p.reconciliationStatus === 'pending').length,
        divergent: reconciliationPayments.filter(p => p.reconciliationStatus === 'divergent').length,
        reconciled: reconciliationPayments.filter(p => p.reconciliationStatus === 'reconciled').length,
      };

      // Get last sync timestamp (in a real implementation, this would be stored)
      const lastSync = new Date().toISOString();

      return {
        summary,
        payments: reconciliationPayments,
        lastSync,
      };
    },
    enabled: !!currentCompanyId,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};