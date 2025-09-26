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

interface RequestExternalPaymentData {
  eventId: string;
  eventTitle: string;
}

interface ApprovePaymentData {
  participantId: string;
  eventId: string;
  paymentMethod: string;
  priceCoins?: number;
}

interface CancelPaymentData {
  participantId: string;
  eventId: string;
  paymentMethod: string;
}

interface RefundPaymentData {
  participantId: string;
  eventId: string;
  paymentMethod: string;
  priceCoins: number;
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
    mutationFn: async (data: RefundPaymentData) => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      // Create refund transaction
      const { error: transactionError } = await supabase
        .from('point_transactions')
        .insert({
          user_id: data.participantId,
          company_id: currentCompanyId,
          action_type: 'refund_item',
          points: data.priceCoins,
          coins: data.priceCoins,
          reference_id: data.eventId,
        });

      if (transactionError) throw transactionError;

      // Update user's total coins
      const { data: userData } = await supabase
        .from('user_points')
        .select('total_coins')
        .eq('user_id', data.participantId)
        .eq('company_id', currentCompanyId)
        .single();

      const currentCoins = userData?.total_coins || 0;
      
      const { error: updateError } = await supabase
        .from('user_points')
        .update({
          total_coins: currentCoins + data.priceCoins,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', data.participantId)
        .eq('company_id', currentCompanyId);

      if (updateError) throw updateError;

      // Update participant status back to cancelled
      const { error: participantError } = await supabase
        .from('event_participants')
        .update({
          payment_status: 'cancelled',
        })
        .eq('id', data.participantId);

      if (participantError) throw participantError;

      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userCoins'] });
      queryClient.invalidateQueries({ queryKey: ['eventParticipants'] });
      toast.success(`Reembolso realizado! ${variables.priceCoins} moedas foram devolvidas.`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao processar reembolso');
    },
  });

  const requestExternalPayment = useMutation({
    mutationFn: async (data: RequestExternalPaymentData) => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      // Create a record to track the external payment request
      const { error } = await supabase
        .from('event_participants')
        .upsert({
          event_id: data.eventId,
          user_id: user.id,
          company_id: currentCompanyId,
          payment_status: 'pending_external',
          payment_method: 'external',
          payment_requested_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['eventParticipants'] });
      toast.success(`Solicitação de pagamento externo registrada para o evento "${variables.eventTitle}".`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao registrar pagamento externo');
    },
  });

  const approvePayment = useMutation({
    mutationFn: async (data: ApprovePaymentData) => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      const updates: any = {
        payment_status: 'approved',
        payment_approved_at: new Date().toISOString(),
        payment_approved_by: user.id,
      };

      // If it's a coins payment, process the actual coin transaction
      if (data.paymentMethod === 'coins' && data.priceCoins) {
        const { error: transactionError } = await supabase
          .from('point_transactions')
          .insert({
            user_id: data.participantId,
            company_id: currentCompanyId,
            action_type: 'purchase_item',
            points: -data.priceCoins,
            coins: -data.priceCoins,
            reference_id: data.eventId,
          });

        if (transactionError) throw transactionError;

        // Update user's total coins
        const { data: userData } = await supabase
          .from('user_points')
          .select('total_coins')
          .eq('user_id', data.participantId)
          .eq('company_id', currentCompanyId)
          .single();

        const currentCoins = userData?.total_coins || 0;

        const { error: updateError } = await supabase
          .from('user_points')
          .update({
            total_coins: currentCoins - data.priceCoins,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', data.participantId)
          .eq('company_id', currentCompanyId);

        if (updateError) throw updateError;
      }

      // Update participant status
      const { error } = await supabase
        .from('event_participants')
        .update(updates)
        .eq('id', data.participantId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventParticipants'] });
      queryClient.invalidateQueries({ queryKey: ['userCoins'] });
      toast.success('Pagamento aprovado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao aprovar pagamento');
    },
  });

  const cancelPayment = useMutation({
    mutationFn: async (data: CancelPaymentData) => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('event_participants')
        .update({
          payment_status: 'cancelled',
          payment_approved_at: new Date().toISOString(),
          payment_approved_by: user.id,
        })
        .eq('id', data.participantId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventParticipants'] });
      toast.success('Pagamento cancelado');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao cancelar pagamento');
    },
  });

  return {
    processPayment,
    refundPayment,
    requestExternalPayment,
    approvePayment,
    cancelPayment,
    userCoins: userCoins?.total_coins || 0,
  };
};