import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Tag {
  id: string;
  company_id: string;
  name: string;
  color: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTagData {
  name: string;
  color: string;
  description?: string;
}

export interface UpdateTagData extends CreateTagData {
  id: string;
}

export const useTags = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tags', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Buscar a empresa do usuário
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!userProfile?.company_id) return [];

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('company_id', userProfile.company_id)
        .order('name');

      if (error) {
        console.error('Error fetching tags:', error);
        return [];
      }

      return data as Tag[];
    },
    enabled: !!user?.id,
  });
};

export const useCreateTag = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData: CreateTagData) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Buscar a empresa do usuário
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!userProfile?.company_id) throw new Error('User company not found');

      const { data, error } = await supabase
        .from('tags')
        .insert({
          ...tagData,
          company_id: userProfile.company_id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error creating tag:', error);
      toast.error('Erro ao criar tag: ' + error.message);
    },
  });
};

export const useUpdateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData: UpdateTagData) => {
      const { id, ...updateData } = tagData;
      
      const { data, error } = await supabase
        .from('tags')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error updating tag:', error);
      toast.error('Erro ao atualizar tag: ' + error.message);
    },
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag excluída com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error deleting tag:', error);
      toast.error('Erro ao excluir tag: ' + error.message);
    },
  });
};