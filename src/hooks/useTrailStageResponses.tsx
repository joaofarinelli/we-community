import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';
import { toast } from '@/components/ui/use-toast';

export interface TrailStageResponse {
  id: string;
  trail_id: string;
  stage_id: string;
  user_id: string;
  company_id: string;
  response_text: string;
  response_data: any; // JSON data for complex responses
  file_urls: string[]; // Array of uploaded file URLs
  created_at: string;
  updated_at: string;
}

export const useTrailStageResponses = (trailId?: string, stageId?: string) => {
  const { user } = useAuth();
  const { data: company } = useCompany();

  return useQuery({
    queryKey: ['trail-stage-responses', trailId, stageId, user?.id, company?.id],
    queryFn: async () => {
      if (!user?.id || !company?.id) {
        throw new Error('User or company not found');
      }

      let query = supabase
        .from('trail_stage_responses')
        .select('*')
        .eq('user_id', user.id)
        .eq('company_id', company.id);

      if (trailId) {
        query = query.eq('trail_id', trailId);
      }

      if (stageId) {
        query = query.eq('stage_id', stageId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as TrailStageResponse[];
    },
    enabled: !!user?.id && !!company?.id,
  });
};

export const useCreateTrailStageResponse = () => {
  const { user } = useAuth();
  const { data: company } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      trailId: string;
      stageId: string;
      responseText?: string;
      responseData?: any;
      fileUrls?: string[];
    }) => {
      if (!user?.id || !company?.id) {
        throw new Error('User or company not found');
      }

      const { data: response, error } = await supabase
        .from('trail_stage_responses')
        .insert({
          trail_id: data.trailId,
          stage_id: data.stageId,
          user_id: user.id,
          company_id: company.id,
          response_text: data.responseText || '',
          response_data: data.responseData || {},
          file_urls: data.fileUrls || [],
        })
        .select()
        .single();

      if (error) throw error;
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trail-stage-responses'] });
      queryClient.invalidateQueries({ queryKey: ['trail-progress'] });
      toast({
        title: 'Resposta enviada!',
        description: 'Sua resposta foi registrada com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Error creating trail stage response:', error);
      toast({
        title: 'Erro ao enviar resposta',
        description: 'Não foi possível registrar sua resposta. Tente novamente.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateTrailStageResponse = () => {
  const { user } = useAuth();
  const { data: company } = useCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      responseId: string;
      responseText?: string;
      responseData?: any;
      fileUrls?: string[];
    }) => {
      if (!user?.id || !company?.id) {
        throw new Error('User or company not found');
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (data.responseText !== undefined) updateData.response_text = data.responseText;
      if (data.responseData !== undefined) updateData.response_data = data.responseData;
      if (data.fileUrls !== undefined) updateData.file_urls = data.fileUrls;

      const { data: response, error } = await supabase
        .from('trail_stage_responses')
        .update(updateData)
        .eq('id', data.responseId)
        .eq('user_id', user.id)
        .eq('company_id', company.id)
        .select()
        .single();

      if (error) throw error;
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trail-stage-responses'] });
      toast({
        title: 'Resposta atualizada!',
        description: 'Sua resposta foi atualizada com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Error updating trail stage response:', error);
      toast({
        title: 'Erro ao atualizar resposta',
        description: 'Não foi possível atualizar sua resposta. Tente novamente.',
        variant: 'destructive',
      });
    },
  });
};

export const useStageResponse = (trailId: string, stageId: string) => {
  const { user } = useAuth();
  const { data: company } = useCompany();

  return useQuery({
    queryKey: ['trail-stage-response', trailId, stageId, user?.id, company?.id],
    queryFn: async () => {
      if (!user?.id || !company?.id) {
        return null;
      }

      const { data, error } = await supabase
        .from('trail_stage_responses')
        .select('*')
        .eq('trail_id', trailId)
        .eq('stage_id', stageId)
        .eq('user_id', user.id)
        .eq('company_id', company.id)
        .maybeSingle();

      if (error) throw error;
      return data as TrailStageResponse | null;
    },
    enabled: !!user?.id && !!company?.id && !!trailId && !!stageId,
  });
};