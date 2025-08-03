import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { useToast } from '@/hooks/use-toast';

export interface AccessGroupMember {
  id: string;
  access_group_id: string;
  user_id: string;
  company_id: string;
  added_by: string;
  added_at: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}

export const useAccessGroupMembers = (accessGroupId?: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['access-group-members', accessGroupId, currentCompanyId],
    queryFn: async () => {
      if (!accessGroupId || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('access_group_members')
        .select(`
          *,
          user:profiles!access_group_members_user_id_fkey(
            first_name,
            last_name,
            email,
            role
          )
        `)
        .eq('access_group_id', accessGroupId)
        .eq('company_id', currentCompanyId);

      if (error) throw error;
      return (data as unknown as AccessGroupMember[]) || [];
    },
    enabled: !!accessGroupId && !!currentCompanyId,
  });

  const addMembers = useMutation({
    mutationFn: async ({ accessGroupId, userIds }: { accessGroupId: string; userIds: string[] }) => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      const membersToAdd = userIds.map(userId => ({
        access_group_id: accessGroupId,
        user_id: userId,
        company_id: currentCompanyId,
        added_by: user.id,
      }));

      const { data, error } = await supabase
        .from('access_group_members')
        .insert(membersToAdd)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['access-group-members', variables.accessGroupId] });
      queryClient.invalidateQueries({ queryKey: ['access-groups'] });
      toast({
        title: "Membros adicionados com sucesso!",
        description: "Os usuários foram adicionados ao grupo de acesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao adicionar membros",
        description: "Não foi possível adicionar os membros ao grupo.",
        variant: "destructive",
      });
    },
  });

  const removeMember = useMutation({
    mutationFn: async ({ memberId }: { memberId: string }) => {
      const { error } = await supabase
        .from('access_group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      if (accessGroupId) {
        queryClient.invalidateQueries({ queryKey: ['access-group-members', accessGroupId] });
        queryClient.invalidateQueries({ queryKey: ['access-groups'] });
      }
      toast({
        title: "Membro removido",
        description: "O usuário foi removido do grupo de acesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao remover membro",
        description: "Não foi possível remover o membro do grupo.",
        variant: "destructive",
      });
    },
  });

  return {
    members: query.data || [],
    isLoading: query.isLoading,
    addMembers,
    removeMember,
  };
};