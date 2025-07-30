import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

export interface TrailStage {
  id: string;
  trail_id?: string;
  template_id?: string;
  name: string;
  description?: string;
  order_index: number;
  guidance_text?: string;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export const useTrailStages = (trailId?: string, templateId?: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['trail-stages', trailId, templateId],
    queryFn: async () => {
      if (!user || !currentCompanyId || (!trailId && !templateId)) return [];

      let query = supabase
        .from('trail_stages')
        .select('*')
        .order('order_index', { ascending: true });

      if (trailId) {
        query = query.eq('trail_id', trailId);
      } else if (templateId) {
        query = query.eq('template_id', templateId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentCompanyId && (!!trailId || !!templateId),
  });
};

export const useCreateTrailStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stageData: {
      trail_id?: string;
      template_id?: string;
      name: string;
      description?: string;
      order_index: number;
      guidance_text?: string;
      is_required?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('trail_stages')
        .insert(stageData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trail-stages'] });
      toast.success('Etapa criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar etapa: ' + error.message);
    },
  });
};

export const useUpdateTrailStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TrailStage>) => {
      const { data, error } = await supabase
        .from('trail_stages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trail-stages'] });
      toast.success('Etapa atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar etapa: ' + error.message);
    },
  });
};

export const useDeleteTrailStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trail_stages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trail-stages'] });
      toast.success('Etapa excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir etapa: ' + error.message);
    },
  });
};