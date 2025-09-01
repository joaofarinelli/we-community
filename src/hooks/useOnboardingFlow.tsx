import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

export interface OnboardingFlow {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useOnboardingFlow = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const flowQuery = useQuery({
    queryKey: ['onboarding-flow', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return null;

      const { data, error } = await supabase
        .from('onboarding_flows')
        .select('*')
        .eq('company_id', currentCompanyId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!currentCompanyId,
  });

  const createFlowMutation = useMutation({
    mutationFn: async (flowData: { name: string; description?: string }) => {
      if (!user || !currentCompanyId) throw new Error('Usuário ou empresa não encontrados');

      const { data, error } = await supabase
        .from('onboarding_flows')
        .insert({
          company_id: currentCompanyId,
          name: flowData.name,
          description: flowData.description,
          created_by: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-flow'] });
      toast.success('Fluxo de onboarding criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar fluxo:', error);
      toast.error('Erro ao criar fluxo de onboarding');
    },
  });

  const updateFlowMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<OnboardingFlow> & { id: string }) => {
      const { data, error } = await supabase
        .from('onboarding_flows')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-flow'] });
      toast.success('Fluxo atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar fluxo:', error);
      toast.error('Erro ao atualizar fluxo');
    },
  });

  const deleteFlowMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('onboarding_flows')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-flow'] });
      toast.success('Fluxo removido com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover fluxo:', error);
      toast.error('Erro ao remover fluxo');
    },
  });

  return {
    flow: flowQuery.data,
    isLoading: flowQuery.isLoading,
    error: flowQuery.error,
    createFlow: createFlowMutation.mutate,
    updateFlow: updateFlowMutation.mutate,
    deleteFlow: deleteFlowMutation.mutate,
    isCreating: createFlowMutation.isPending,
    isUpdating: updateFlowMutation.isPending,
    isDeleting: deleteFlowMutation.isPending,
  };
};