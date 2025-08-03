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

      // First get the members without joining
      const { data: membersData, error: membersError } = await supabase
        .from('access_group_members')
        .select('*')
        .eq('access_group_id', accessGroupId)
        .eq('company_id', currentCompanyId);

      if (membersError) {
        console.error('Error fetching members:', membersError);
        throw membersError;
      }

      // Then get the profile data for each user
      if (!membersData || membersData.length === 0) {
        console.log('No members found');
        return [];
      }

      const userIds = membersData.map(member => member.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, role')
        .in('user_id', userIds)
        .eq('company_id', currentCompanyId);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Combine the data
      const result = membersData.map(member => ({
        ...member,
        profiles: profilesData?.find(profile => profile.user_id === member.user_id)
      }));

      console.log('Fetched members with profiles:', result);
      return result;
    },
    enabled: !!accessGroupId && !!currentCompanyId,
  });

  const addMembers = useMutation({
    mutationFn: async ({ accessGroupId, userIds }: { accessGroupId: string; userIds: string[] }) => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      console.log('Adding members:', { accessGroupId, userIds, currentCompanyId, userId: user.id });

      // Check for existing members to avoid duplicates
      const { data: existingMembers } = await supabase
        .from('access_group_members')
        .select('user_id')
        .eq('access_group_id', accessGroupId)
        .in('user_id', userIds);

      const existingUserIds = existingMembers?.map(m => m.user_id) || [];
      const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

      if (newUserIds.length === 0) {
        throw new Error('Todos os usuários selecionados já são membros deste grupo');
      }

      const membersToAdd = newUserIds.map(userId => ({
        access_group_id: accessGroupId,
        user_id: userId,
        company_id: currentCompanyId,
        added_by: user.id,
      }));

      console.log('Members to add (filtered):', membersToAdd);

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
        description: `${data.length} usuário(s) adicionado(s) ao grupo de acesso.`,
      });
    },
    onError: (error: any) => {
      console.error('Error in addMembers mutation:', error);
      toast({
        title: "Erro ao adicionar membros",
        description: error.message || "Não foi possível adicionar os membros ao grupo.",
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