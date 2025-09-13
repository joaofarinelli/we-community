import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompanyContext } from './useCompanyContext';

export const usePinChallenge = () => {
  const queryClient = useQueryClient();
  const { currentCompanyId } = useCompanyContext();

  return useMutation({
    mutationFn: async ({ challengeId, isPinned }: { challengeId: string; isPinned: boolean }) => {
      if (!currentCompanyId) {
        throw new Error('No company context available');
      }

      if (isPinned) {
        // When pinning, find the highest pinned_order and add 1
        const { data: pinnedChallenges } = await supabase
          .from('challenges')
          .select('pinned_order')
          .eq('company_id', currentCompanyId)
          .eq('is_pinned', true)
          .order('pinned_order', { ascending: false })
          .limit(1);

        const nextOrder = pinnedChallenges && pinnedChallenges.length > 0 
          ? (pinnedChallenges[0].pinned_order || 0) + 1 
          : 1;

        const { error } = await supabase
          .from('challenges')
          .update({ 
            is_pinned: true, 
            pinned_order: nextOrder 
          })
          .eq('id', challengeId)
          .eq('company_id', currentCompanyId);

        if (error) throw error;
      } else {
        // When unpinning, remove pinned status and order
        const { error } = await supabase
          .from('challenges')
          .update({ 
            is_pinned: false, 
            pinned_order: null 
          })
          .eq('id', challengeId)
          .eq('company_id', currentCompanyId);

        if (error) throw error;
      }
    },
    onSuccess: (_, { isPinned }) => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['manage-challenges'] });
      toast.success(isPinned ? 'Desafio fixado com sucesso!' : 'Desafio removido dos fixados!');
    },
    onError: (error) => {
      console.error('Error pinning/unpinning challenge:', error);
      toast.error('Erro ao alterar status do desafio');
    },
  });
};