import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

export interface UserTag {
  id: string;
  user_id: string;
  tag_id: string;
  company_id: string;
  assigned_by: string;
  assigned_at: string;
  tags: {
    id: string;
    name: string;
    color: string;
    icon_type: string;
    icon_value: string | null;
  };
}

export const useUserTags = (userId: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['user-tags', userId, currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !userId || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('user_tags')
        .select(`
          id,
          user_id,
          tag_id,
          company_id,
          assigned_by,
          assigned_at,
          tags!inner (
            id,
            name,
            color,
            icon_type,
            icon_value
          )
        `)
        .eq('user_id', userId)
        .eq('company_id', currentCompanyId);

      if (error) {
        console.error('Error fetching user tags:', error);
        return [];
      }

      return data as UserTag[];
    },
    enabled: !!user?.id && !!userId && !!currentCompanyId,
  });
};

export const useAssignTag = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, tagId }: { userId: string; tagId: string }) => {
      if (!user?.id || !currentCompanyId) throw new Error('User not authenticated or no company context');

      const { data, error } = await supabase
        .from('user_tags')
        .insert({
          user_id: userId,
          tag_id: tagId,
          company_id: currentCompanyId,
          assigned_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-tags', variables.userId, currentCompanyId] });
      queryClient.invalidateQueries({ queryKey: ['company-members'] });
      toast.success('Tag adicionada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error assigning tag:', error);
      toast.error('Erro ao adicionar tag: ' + error.message);
    },
  });
};

export const useRemoveTag = () => {
  const queryClient = useQueryClient();
  const { currentCompanyId } = useCompanyContext();

  return useMutation({
    mutationFn: async ({ userId, tagId }: { userId: string; tagId: string }) => {
      const { error } = await supabase
        .from('user_tags')
        .delete()
        .eq('user_id', userId)
        .eq('tag_id', tagId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-tags', variables.userId, currentCompanyId] });
      queryClient.invalidateQueries({ queryKey: ['company-members'] });
      toast.success('Tag removida com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error removing tag:', error);
      toast.error('Erro ao remover tag: ' + error.message);
    },
  });
};