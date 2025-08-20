import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from '@/hooks/use-toast';

export const useManageUserStatus = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const toggleUserStatus = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      if (!user?.id || !currentCompanyId) {
        throw new Error('User not authenticated or company context missing');
      }

      console.log('useManageUserStatus: Setting context for company:', currentCompanyId);

      // Definir explicitamente o contexto da empresa antes da operação
      await supabase.rpc('set_current_company_context', {
        p_company_id: currentCompanyId
      });

      const { data, error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('user_id', userId)
        .eq('company_id', currentCompanyId) // Ensure we only update in current company
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['company-members'] });
      queryClient.invalidateQueries({ queryKey: ['company-users-filtered'] });
      toast({
        title: variables.isActive ? 'Usuário ativado' : 'Usuário inativado',
        description: variables.isActive 
          ? 'O usuário foi ativado e pode acessar a comunidade.'
          : 'O usuário foi inativado e não pode mais acessar a comunidade.',
      });
    },
    onError: (error) => {
      console.error('useManageUserStatus: Error toggling user status:', error);
      toast({
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar o status do usuário.',
        variant: 'destructive',
      });
    }
  });

  const checkUserActiveStatus = async () => {
    if (!user?.id || !currentCompanyId) return false;
    
    console.log('useManageUserStatus: Checking active status for user:', user.id, 'in company:', currentCompanyId);

    // Definir explicitamente o contexto da empresa antes da consulta
    await supabase.rpc('set_current_company_context', {
      p_company_id: currentCompanyId
    });
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('user_id', user.id)
      .eq('company_id', currentCompanyId)
      .maybeSingle();

    if (error || !data) {
      console.error('useManageUserStatus: Error checking user status:', error);
      return false;
    }
    return data.is_active;
  };

  return {
    toggleUserStatus,
    checkUserActiveStatus
  };
};