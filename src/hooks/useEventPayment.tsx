import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { useUserCoins } from './useUserPoints';
import { toast } from 'sonner';

interface ProcessEventPaymentData {
  eventId: string;
  priceCoins: number;
  eventTitle: string;
}

export const useEventPayment = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();
  const { data: userCoins } = useUserCoins();

  const processPayment = useMutation({
    mutationFn: async (data: ProcessEventPaymentData) => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      // Check if user has enough coins
      const currentCoins = userCoins?.total_coins || 0;
      if (currentCoins < data.priceCoins) {
        throw new Error('Saldo insuficiente de moedas');
      }

      // Create payment transaction
      const { error: transactionError } = await supabase
        .from('point_transactions')
        .insert({
          user_id: user.id,
          company_id: currentCompanyId,
          action_type: 'purchase_item',
          points: -data.priceCoins,
          coins: -data.priceCoins,
          reference_id: data.eventId,
        });

      if (transactionError) throw transactionError;

      // Update user's total coins
      const { error: updateError } = await supabase
        .from('user_points')
        .update({
          total_coins: currentCoins - data.priceCoins,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('company_id', currentCompanyId);

      if (updateError) throw updateError;

      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userCoins'] });
      toast.success(`Pagamento realizado com sucesso! Você pode participar do evento "${variables.eventTitle}".`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao processar pagamento');
    },
  });

  const refundPayment = useMutation({
    mutationFn: async (data: ProcessEventPaymentData) => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      // Create refund transaction
      const { error: transactionError } = await supabase
        .from('point_transactions')
        .insert({
          user_id: user.id,
          company_id: currentCompanyId,
          action_type: 'refund_item',
          points: data.priceCoins,
          coins: data.priceCoins,
          reference_id: data.eventId,
        });

      if (transactionError) throw transactionError;

      // Update user's total coins
      const currentCoins = userCoins?.total_coins || 0;
      const { error: updateError } = await supabase
        .from('user_points')
        .update({
          total_coins: currentCoins + data.priceCoins,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('company_id', currentCompanyId);

      if (updateError) throw updateError;

      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userCoins'] });
      toast.success(`Reembolso realizado! ${variables.priceCoins} moedas foram devolvidas.`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao processar reembolso');
    },
  });

  return {
    processPayment,
    refundPayment,
    userCoins: userCoins?.total_coins || 0,
  };
};