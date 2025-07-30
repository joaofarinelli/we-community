import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

export interface TrailTemplate {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  life_area?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export const useTrailTemplates = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['trail-templates', currentCompanyId],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('trail_templates')
        .select('*')
        .eq('company_id', currentCompanyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentCompanyId,
  });
};

export const useCreateTrailTemplate = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useMutation({
    mutationFn: async (templateData: {
      name: string;
      description?: string;
      life_area?: string;
    }) => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('trail_templates')
        .insert({
          ...templateData,
          company_id: currentCompanyId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trail-templates'] });
      toast.success('Template criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar template: ' + error.message);
    },
  });
};

export const useUpdateTrailTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TrailTemplate>) => {
      const { data, error } = await supabase
        .from('trail_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trail-templates'] });
      toast.success('Template atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar template: ' + error.message);
    },
  });
};

export const useDeleteTrailTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trail_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trail-templates'] });
      toast.success('Template desativado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao desativar template: ' + error.message);
    },
  });
};