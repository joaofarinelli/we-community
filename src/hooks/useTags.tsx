import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';
import { toast } from 'sonner';

export interface Tag {
  id: string;
  company_id: string;
  name: string;
  color: string;
  description: string | null;
  icon_type: 'none' | 'emoji' | 'image';
  icon_value: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTagData {
  name: string;
  color: string;
  description?: string;
  icon_type?: 'none' | 'emoji' | 'image';
  icon_value?: string;
}

export interface UpdateTagData extends CreateTagData {
  id: string;
}

export const useTags = () => {
  const { user } = useAuth();
  const { data: company } = useCompany();

  return useQuery({
    queryKey: ['tags', user?.id, company?.id],
    queryFn: async () => {
      if (!user?.id || !company?.id) return [];

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('company_id', company.id)
        .order('name');

      if (error) {
        console.error('Error fetching tags:', error);
        return [];
      }

      return data as Tag[];
    },
    enabled: !!user?.id && !!company?.id,
  });
};

export const useCreateTag = () => {
  const { user } = useAuth();
  const { data: company } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData: CreateTagData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      if (!company?.id) throw new Error('Nenhuma empresa selecionada');

      const { data, error } = await supabase
        .from('tags')
        .insert({
          ...tagData,
          company_id: company.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', user?.id, company?.id] });
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