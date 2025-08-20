import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';
import { ensureCompanyContext } from '@/lib/ensureCompanyContext';

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

export const useTags = (contextReady = true) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['tags', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId) return [];

      console.debug('useTags: Starting query for company:', currentCompanyId);

      // Ensure company context is set before the query
      await ensureCompanyContext(currentCompanyId);

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('company_id', currentCompanyId)
        .order('name');

      if (error) {
        console.error('useTags: Error fetching tags:', error);
        throw error;
      }

      console.debug('useTags: Successfully fetched', data?.length || 0, 'tags');
      return data as Tag[];
    },
    enabled: !!user?.id && !!currentCompanyId && contextReady,
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const useCreateTag = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData: CreateTagData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      if (!currentCompanyId) throw new Error('Nenhuma empresa selecionada');

      // Ensure company context is set before the operation
      await ensureCompanyContext(currentCompanyId);

      const { data, error } = await supabase
        .from('tags')
        .insert({
          ...tagData,
          company_id: currentCompanyId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', user?.id, currentCompanyId] });
      toast.success('Tag criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error creating tag:', error);
      toast.error('Erro ao criar tag: ' + error.message);
    },
  });
};

export const useUpdateTag = () => {
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData: UpdateTagData) => {
      if (!currentCompanyId) throw new Error('Empresa não encontrada');
      
      // Ensure company context is set before the operation
      await ensureCompanyContext(currentCompanyId);

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
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagId: string) => {
      if (!currentCompanyId) throw new Error('Empresa não encontrada');
      
      // Ensure company context is set before the operation
      await ensureCompanyContext(currentCompanyId);

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