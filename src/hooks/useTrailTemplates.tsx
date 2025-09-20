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
  cover_url?: string;
  is_active: boolean;
  is_pinned: boolean;
  pinned_order?: number;
  order_index: number;
  access_criteria?: {
    required_level_id?: string;
    required_tags?: string[];
    required_roles?: string[];
    is_available_for_all?: boolean;
  };
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
        .select(`
          id,
          name,
          description,
          cover_url,
          is_pinned,
          pinned_order,
          order_index,
          created_at,
          access_criteria
        `)
        .eq('company_id', currentCompanyId)
        .eq('is_active', true)
        .order('is_pinned', { ascending: false })
        .order('pinned_order', { ascending: true, nullsFirst: false })
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(template => ({
        ...template,
        access_criteria: template.access_criteria || {
          is_available_for_all: true,
          required_level_id: undefined,
          required_tags: [],
          required_roles: []
        }
      })) as TrailTemplate[];
    },
    enabled: !!user && !!currentCompanyId,
    staleTime: 120000, // 2 minutes
    gcTime: 600000, // 10 minutes
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
      cover_url?: string;
      access_criteria?: {
        required_level_id?: string;
        required_tags?: string[];
        required_roles?: string[];
        is_available_for_all?: boolean;
      };
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

export const usePinTrailTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, isPinned, pinnedOrder }: { templateId: string; isPinned: boolean; pinnedOrder?: number }) => {
      const { error } = await supabase
        .from('trail_templates')
        .update({ 
          is_pinned: isPinned,
          pinned_order: isPinned ? pinnedOrder : null
        })
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trail-templates'] });
      toast.success(
        variables.isPinned ? "Trilha fixada no topo!" : "Trilha removida do topo"
      );
    },
    onError: (error) => {
      console.error('Error updating template pinning:', error);
      toast.error("Erro ao atualizar a trilha");
    },
  });
};