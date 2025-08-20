import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export const useManageUserStatus = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const toggleUserStatus = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('user_id', userId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['company-members'] });
      toast({
        title: variables.isActive ? 'Usuário ativado' : 'Usuário inativado',
        description: variables.isActive 
          ? 'O usuário foi ativado e pode acessar a comunidade.'
          : 'O usuário foi inativado e não pode mais acessar a comunidade.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar o status do usuário.',
        variant: 'destructive',
      });
    }
  });

  const checkUserActiveStatus = async () => {
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return false;
    return data.is_active;
  };

  return {
    toggleUserStatus,
    checkUserActiveStatus
  };
};