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

      console.log('🚀 Starting streak check-in for user:', user.id, 'company:', currentCompanyId);

      // Always set the context before any streak operation
      try {
        console.log('🔧 Setting company context...');
        await supabase.rpc('set_current_company_context', {
          p_company_id: currentCompanyId
        });
        console.log('✅ Context set successfully for company:', currentCompanyId);
      } catch (contextError) {
        console.error('❌ Failed to set context for streak check-in:', contextError);
        throw new Error('Failed to set company context');
      }

      // Wait a small moment to ensure context is applied
      await new Promise(resolve => setTimeout(resolve, 100));

      // Now perform the streak update
      console.log('📈 Calling update_user_streak...');
      const { data, error } = await supabase.rpc('update_user_streak', {
        p_user_id: user.id,
        p_company_id: currentCompanyId
      });

      if (error) {
        console.error('❌ Streak check-in error:', error);
        throw error;
      }

      console.log('✅ Streak check-in successful for company:', currentCompanyId, 'data:', data);
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
      
      let errorMessage = 'Não foi possível realizar o check-in.';
      
      if (error.message?.includes('context')) {
        errorMessage = 'Erro de contexto da empresa. Tente trocar e voltar para esta empresa.';
      } else if (error.message?.includes('RLS')) {
        errorMessage = 'Erro de permissão. Verifique se você tem acesso a esta empresa.';
      } else if (error.message?.includes('mismatch')) {
        errorMessage = 'Contexto da empresa incorreto. Recarregue a página e tente novamente.';
      }
      
      toast({
        title: 'Erro no check-in',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};