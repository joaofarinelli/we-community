import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

export type ResponseStatus = 'pending' | 'completed' | 'skipped';

export interface TrailResponse {
  id: string;
  trail_id: string;
  stage_id: string;
  field_id: string;
  user_id: string;
  company_id: string;
  response_value?: any;
  file_url?: string;
  status: ResponseStatus;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export const useTrailResponses = (trailId?: string, stageId?: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['trail-responses', trailId, stageId, user?.id],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

      let query = supabase
        .from('trail_responses')
        .select('*')
        .eq('company_id', currentCompanyId)
        .eq('user_id', user.id);

      if (trailId) query = query.eq('trail_id', trailId);
      if (stageId) query = query.eq('stage_id', stageId);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentCompanyId,
  });
};

export const useCreateTrailResponse = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useMutation({
    mutationFn: async (responseData: {
      trail_id: string;
      stage_id: string;
      field_id: string;
      response_value?: any;
      file_url?: string;
    }) => {
      if (!user || !currentCompanyId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('trail_responses')
        .insert({
          ...responseData,
          user_id: user.id,
          company_id: currentCompanyId,
          status: 'completed' as ResponseStatus,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trail-responses'] });
      queryClient.invalidateQueries({ queryKey: ['trail-progress'] });
      toast.success('Resposta salva com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar resposta: ' + error.message);
    },
  });
};

export const useUpdateTrailResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TrailResponse>) => {
      const { data, error } = await supabase
        .from('trail_responses')
        .update({
          ...updates,
          completed_at: updates.status === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trail-responses'] });
      queryClient.invalidateQueries({ queryKey: ['trail-progress'] });
      toast.success('Resposta atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar resposta: ' + error.message);
    },
  });
};