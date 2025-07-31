import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

export type ResponseType = 'text' | 'multiple_choice' | 'checkbox' | 'file_upload' | 'image_upload' | 'scale';

export interface ResponseOption {
  id: string;
  label: string;
  value: string;
}

export interface TrailStage {
  id: string;
  trail_id?: string;
  template_id?: string;
  name: string;
  description?: string;
  order_index: number;
  guidance_text?: string;
  is_required: boolean;
  video_url?: string;
  document_url?: string;
  question?: string;
  requires_response: boolean;
  response_type: ResponseType;
  response_options: any; // Will be parsed from JSONB
  allow_multiple_files: boolean;
  max_file_size_mb: number;
  allowed_file_types: string[];
  created_at: string;
  updated_at: string;
}

// Helper function to parse response options
export const parseResponseOptions = (options: any): ResponseOption[] => {
  if (!options) return [];
  if (typeof options === 'string') {
    try {
      return JSON.parse(options);
    } catch {
      return [];
    }
  }
  return Array.isArray(options) ? options : [];
};

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
      video_url?: string;
      document_url?: string;
      question?: string;
      requires_response?: boolean;
      response_type?: ResponseType;
      response_options?: any;
      allow_multiple_files?: boolean;
      max_file_size_mb?: number;
      allowed_file_types?: string[];
    }) => {
      // Prepare the data for submission
      const submitData = {
        ...stageData,
        response_type: stageData.response_type || 'text',
        response_options: stageData.response_options || [],
        allow_multiple_files: stageData.allow_multiple_files || false,
        max_file_size_mb: stageData.max_file_size_mb || 10,
        allowed_file_types: stageData.allowed_file_types || [],
      };

      const { data, error } = await supabase
        .from('trail_stages')
        .insert(submitData)
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