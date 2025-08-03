import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { useToast } from '@/hooks/use-toast';

export interface AccessGroupSpace {
  id: string;
  access_group_id: string;
  space_id: string;
  company_id: string;
  added_by: string;
  added_at: string;
}

export const useAccessGroupSpaces = (accessGroupId?: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['access-group-spaces', accessGroupId, currentCompanyId],
    queryFn: async () => {
      if (!accessGroupId || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('access_group_spaces')
        .select('*')
        .eq('access_group_id', accessGroupId)
        .eq('company_id', currentCompanyId);

      if (error) throw error;
      return (data as AccessGroupSpace[]) || [];
    },
    enabled: !!accessGroupId && !!currentCompanyId,
  });

  const updateSpaces = useMutation({
    mutationFn: async ({ accessGroupId, spaceIds }: { accessGroupId: string; spaceIds: string[] }) => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      // First, remove all existing spaces for this group
      await supabase
        .from('access_group_spaces')
        .delete()
        .eq('access_group_id', accessGroupId)
        .eq('company_id', currentCompanyId);

      // Then add the new spaces
      if (spaceIds.length > 0) {
        const spacesToAdd = spaceIds.map(spaceId => ({
          access_group_id: accessGroupId,
          space_id: spaceId,
          company_id: currentCompanyId,
          added_by: user.id,
        }));

        const { data, error } = await supabase
          .from('access_group_spaces')
          .insert(spacesToAdd)
          .select();

        if (error) throw error;
        return data;
      }

      return [];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['access-group-spaces', variables.accessGroupId] });
      queryClient.invalidateQueries({ queryKey: ['access-groups'] });
      toast({
        title: "Acessos atualizados!",
        description: "Os acessos do grupo foram salvos com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error updating spaces:', error);
      toast({
        title: "Erro ao salvar acessos",
        description: error.message || "Não foi possível salvar os acessos do grupo.",
        variant: "destructive",
      });
    },
  });

  return {
    spaces: query.data || [],
    isLoading: query.isLoading,
    updateSpaces,
  };
};