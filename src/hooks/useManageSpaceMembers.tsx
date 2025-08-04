import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';
import { toast } from '@/hooks/use-toast';

export const useManageSpaceMembers = () => {
  const { user } = useAuth();
  const { data: company } = useCompany();
  const queryClient = useQueryClient();

  const addMember = useMutation({
    mutationFn: async ({ spaceId, userId }: { spaceId: string; userId: string }) => {
      if (!company) throw new Error('Company not found');
      
      const { data, error } = await supabase
        .from('space_members')
        .insert([
          {
            space_id: spaceId,
            user_id: userId,
            company_id: company.id,
            role: 'member'
          }
        ])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spaceMembers', variables.spaceId] });
      toast({
        title: 'Membro adicionado',
        description: 'O usuário foi adicionado ao espaço com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar membro',
        description: 'Não foi possível adicionar o membro ao espaço.',
        variant: 'destructive',
      });
    }
  });

  const removeMember = useMutation({
    mutationFn: async ({ spaceId, userId }: { spaceId: string; userId: string }) => {
      const { error } = await supabase
        .from('space_members')
        .delete()
        .eq('space_id', spaceId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spaceMembers', variables.spaceId] });
      toast({
        title: 'Membro removido',
        description: 'O usuário foi removido do espaço com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover membro',
        description: 'Não foi possível remover o membro do espaço.',
        variant: 'destructive',
      });
    }
  });

  const joinSpace = useMutation({
    mutationFn: async (spaceId: string) => {
      if (!user || !company) throw new Error('Usuário não autenticado ou empresa não encontrada');
      
      const { data, error } = await supabase
        .from('space_members')
        .insert([
          {
            space_id: spaceId,
            user_id: user.id,
            company_id: company.id,
            role: 'member'
          }
        ])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, spaceId) => {
      queryClient.invalidateQueries({ queryKey: ['spaceMembers', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['userMemberSpaces'] });
      queryClient.invalidateQueries({ queryKey: ['userSpaces'] });
      toast({
        title: 'Entrou no espaço',
        description: 'Você entrou no espaço com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao entrar no espaço',
        description: 'Não foi possível entrar no espaço.',
        variant: 'destructive',
      });
    }
  });

  const leaveSpace = useMutation({
    mutationFn: async (spaceId: string) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('space_members')
        .delete()
        .eq('space_id', spaceId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: (_, spaceId) => {
      queryClient.invalidateQueries({ queryKey: ['spaceMembers', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['userMemberSpaces'] });
      queryClient.invalidateQueries({ queryKey: ['userSpaces'] });
      toast({
        title: 'Saiu do espaço',
        description: 'Você saiu do espaço com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao sair do espaço',
        description: 'Não foi possível sair do espaço.',
        variant: 'destructive',
      });
    }
  });

  return {
    addMember,
    removeMember,
    joinSpace,
    leaveSpace
  };
};