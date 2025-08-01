import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { useToast } from '@/hooks/use-toast';

export interface AccessGroup {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  space_count?: number;
}

export const useAccessGroups = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['access-groups', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return [];

      // Use SQL query directly to bypass type issues
      const { data, error } = await supabase
        .rpc('get_user_company_id')
        .then(async () => {
          const response = await (supabase as any).from('access_groups')
            .select('*')
            .eq('company_id', currentCompanyId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });
          return response;
        });

      if (error) throw error;
      return (data as unknown as AccessGroup[]) || [];
    },
    enabled: !!currentCompanyId,
  });

  const createGroup = useMutation({
    mutationFn: async (groupData: { name: string; description?: string }) => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('access_groups' as any)
        .insert({
          company_id: currentCompanyId,
          name: groupData.name,
          description: groupData.description,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-groups'] });
      toast({
        title: "Grupo criado com sucesso!",
        description: "O grupo de acesso foi criado.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao criar grupo",
        description: "Não foi possível criar o grupo de acesso.",
        variant: "destructive",
      });
    },
  });

  const updateGroup = useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string; name?: string; description?: string }) => {
      const { data, error } = await supabase
        .from('access_groups' as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-groups'] });
      toast({
        title: "Grupo atualizado!",
        description: "As alterações foram salvas.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar grupo",
        description: "Não foi possível atualizar o grupo.",
        variant: "destructive",
      });
    },
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('access_groups' as any)
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-groups'] });
      toast({
        title: "Grupo removido",
        description: "O grupo foi removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao remover grupo",
        description: "Não foi possível remover o grupo.",
        variant: "destructive",
      });
    },
  });

  return {
    accessGroups: query.data || [],
    isLoading: query.isLoading,
    createGroup,
    updateGroup,
    deleteGroup,
  };
};