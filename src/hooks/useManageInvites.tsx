import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from './useCompany';
import { toast } from 'sonner';

export const useManageInvites = () => {
  const queryClient = useQueryClient();
  const { data: company } = useCompany();

  const revokeInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('user_invites')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', inviteId)
        .eq('company_id', company?.id)
        .eq('status', 'pending'); // Only allow cancelling pending invites

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-invites'] });
      toast.success('Convite revogado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao revogar convite: ${error.message}`);
    },
  });

  const resendInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      // Update the expiration date to 7 days from now
      const newExpirationDate = new Date();
      newExpirationDate.setDate(newExpirationDate.getDate() + 7);

      const { error } = await supabase
        .from('user_invites')
        .update({ 
          expires_at: newExpirationDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', inviteId)
        .eq('company_id', company?.id)
        .eq('status', 'pending');

      if (error) throw error;

      // TODO: Here you could also call an edge function to resend the email
      // For now, we'll just update the expiration date
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-invites'] });
      toast.success('Convite reenviado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao reenviar convite: ${error.message}`);
    },
  });

  return {
    revokeInvite: revokeInvite.mutate,
    resendInvite: resendInvite.mutate,
    isRevoking: revokeInvite.isPending,
    isResending: resendInvite.isPending,
  };
};