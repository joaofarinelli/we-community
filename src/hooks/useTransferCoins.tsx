import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from '@/components/ui/use-toast';

interface TransferCoinsParams {
  toUserId: string;
  amount: number;
  message?: string;
}

export const useTransferCoins = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ toUserId, amount, message }: TransferCoinsParams) => {
      if (!user) throw new Error('Usuário não autenticado');
      if (!currentCompanyId) throw new Error('Selecione uma empresa para realizar a transferência.');

      // Validate that the user has a profile in the current company
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, company_id')
        .eq('user_id', user.id)
        .eq('company_id', currentCompanyId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Perfil não encontrado para a empresa atual.');

      // Call the transfer function
      const { data, error } = await supabase.rpc('transfer_user_coins', {
        p_from_user_id: user.id,
        p_to_user_id: toUserId,
        p_company_id: currentCompanyId,
        p_coins: amount,
        p_reference_id: null
      });

      if (error) throw error;
      if (!data) throw new Error('Saldo insuficiente');

      return data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['userCoins'] });
      queryClient.invalidateQueries({ queryKey: ['pointsHistory'] });
      
      toast({
        title: "Transferência realizada!",
        description: "As moedas foram transferidas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro na transferência",
        description: error.message || "Não foi possível realizar a transferência.",
      });
    },
  });
};