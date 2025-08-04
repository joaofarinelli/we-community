import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { useToast } from '@/hooks/use-toast';

export const useStreakCheckIn = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id || !currentCompanyId) {
        throw new Error('User or company context not available');
      }

      // First, ensure the Supabase context is set correctly
      try {
        await supabase.rpc('set_current_company_context', {
          p_company_id: currentCompanyId
        });
        console.log('✅ Context set for streak check-in, company:', currentCompanyId);
      } catch (contextError) {
        console.error('❌ Failed to set context for streak check-in:', contextError);
        throw new Error('Failed to set company context');
      }

      // Now perform the streak update
      const { data, error } = await supabase.rpc('update_user_streak', {
        p_user_id: user.id,
        p_company_id: currentCompanyId
      });

      if (error) {
        console.error('❌ Streak check-in error:', error);
        throw error;
      }

      console.log('✅ Streak check-in successful for company:', currentCompanyId);
      return data;
    },
    onSuccess: () => {
      // Invalidate related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['userStreak'] });
      queryClient.invalidateQueries({ queryKey: ['userPoints'] });
      queryClient.invalidateQueries({ queryKey: ['userCoins'] });
      
      toast({
        title: 'Check-in realizado!',
        description: 'Sua sequência foi atualizada com sucesso.',
      });
    },
    onError: (error: any) => {
      console.error('❌ Streak check-in failed:', error);
      toast({
        title: 'Erro no check-in',
        description: error.message || 'Não foi possível realizar o check-in.',
        variant: 'destructive',
      });
    },
  });
};