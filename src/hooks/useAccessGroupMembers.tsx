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
  profiles?: {
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

      console.log('Fetching access group members for:', { accessGroupId, currentCompanyId });

      const { data, error } = await supabase
        .from('access_group_members')
        .select(`
          *,
          profiles!inner(
            first_name,
            last_name,
            email,
            role
          )
        `)
        .eq('access_group_id', accessGroupId)
        .eq('company_id', currentCompanyId);

      if (error) {
        console.error('Error fetching members:', error);
        throw error;
      }
      
      console.log('Fetched members:', data);
      return (data as unknown as AccessGroupMember[]) || [];
    },
    enabled: !!accessGroupId && !!currentCompanyId,
  });

  const addMembers = useMutation({
    mutationFn: async ({ accessGroupId, userIds }: { accessGroupId: string; userIds: string[] }) => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      console.log('Adding members:', { accessGroupId, userIds, currentCompanyId, userId: user.id });

      const membersToAdd = userIds.map(userId => ({
        access_group_id: accessGroupId,
        user_id: userId,
        company_id: currentCompanyId,
        added_by: user.id,
      }));

      console.log('Members to add:', membersToAdd);

      const { data, error } = await supabase
        .from('access_group_members')
        .insert(membersToAdd)
        .select();

      if (error) {
        console.error('Error inserting members:', error);
        throw error;
      }
      
      console.log('Successfully added members:', data);
      return data;
    },
    onSuccess: (data, variables) => {
      console.log('Members added successfully, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['access-group-members', variables.accessGroupId] });
      queryClient.invalidateQueries({ queryKey: ['access-groups'] });
      toast({
        title: "Membros adicionados com sucesso!",
        description: "Os usuários foram adicionados ao grupo de acesso.",
      });
    },
    onError: (error) => {
      console.error('Error in addMembers mutation:', error);
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