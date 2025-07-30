import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

export type FieldType = 'text' | 'textarea' | 'multiple_choice' | 'scale' | 'date' | 'file_upload' | 'task_status';

export interface TrailField {
  id: string;
  stage_id: string;
  field_name: string;
  field_type: FieldType;
  field_label: string;
  field_description?: string;
  is_required: boolean;
  field_options?: any;
  order_index: number;
  gamification_points: number;
  created_at: string;
  updated_at: string;
}

export const useTrailFields = (stageId?: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['trail-fields', stageId],
    queryFn: async () => {
      if (!user || !currentCompanyId || !stageId) return [];

      const { data, error } = await supabase
        .from('trail_fields')
        .select('*')
        .eq('stage_id', stageId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentCompanyId && !!stageId,
  });
};

export const useCreateTrailField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fieldData: {
      stage_id: string;
      field_name: string;
      field_type: FieldType;
      field_label: string;
      field_description?: string;
      is_required?: boolean;
      field_options?: any;
      order_index: number;
      gamification_points?: number;
    }) => {
      const { data, error } = await supabase
        .from('trail_fields')
        .insert(fieldData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trail-fields'] });
      toast.success('Campo criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar campo: ' + error.message);
    },
  });
};

export const useUpdateTrailField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TrailField>) => {
      const { data, error } = await supabase
        .from('trail_fields')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trail-fields'] });
      toast.success('Campo atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar campo: ' + error.message);
    },
  });
};

export const useDeleteTrailField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trail_fields')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trail-fields'] });
      toast.success('Campo excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir campo: ' + error.message);
    },
  });
};