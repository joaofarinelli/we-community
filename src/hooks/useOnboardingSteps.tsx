import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

export interface OnboardingStep {
  id: string;
  flow_id: string;
  step_type: 'welcome' | 'profile' | 'spaces' | 'tags' | 'terms' | 'finish';
  title: string;
  description?: string;
  order_index: number;
  config: any;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export const useOnboardingSteps = (flowId?: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const stepsQuery = useQuery({
    queryKey: ['onboarding-steps', flowId],
    queryFn: async () => {
      if (!flowId) return [];

      const { data, error } = await supabase
        .from('onboarding_steps')
        .select('*')
        .eq('flow_id', flowId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return (data || []) as OnboardingStep[];
    },
    enabled: !!flowId,
  });

  const createStepMutation = useMutation({
    mutationFn: async (stepData: Omit<OnboardingStep, 'id' | 'created_at' | 'updated_at'>) => {
      if (!flowId) throw new Error('Flow ID é obrigatório');

      const { data, error } = await supabase
        .from('onboarding_steps')
        .insert({
          ...stepData,
          flow_id: flowId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-steps', flowId] });
      toast.success('Passo adicionado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar passo:', error);
      toast.error('Erro ao adicionar passo');
    },
  });

  const updateStepMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<OnboardingStep> & { id: string }) => {
      const { data, error } = await supabase
        .from('onboarding_steps')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-steps', flowId] });
      toast.success('Passo atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar passo:', error);
      toast.error('Erro ao atualizar passo');
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('onboarding_steps')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-steps', flowId] });
      toast.success('Passo removido com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover passo:', error);
      toast.error('Erro ao remover passo');
    },
  });

  const reorderStepsMutation = useMutation({
    mutationFn: async (steps: OnboardingStep[]) => {
      const updates = steps.map((step, index) =>
        supabase
          .from('onboarding_steps')
          .update({ order_index: index })
          .eq('id', step.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error('Erro ao reordenar passos');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-steps', flowId] });
      toast.success('Ordem dos passos atualizada!');
    },
    onError: (error) => {
      console.error('Erro ao reordenar passos:', error);
      toast.error('Erro ao reordenar passos');
    },
  });

  return {
    steps: stepsQuery.data || [],
    isLoading: stepsQuery.isLoading,
    error: stepsQuery.error,
    createStep: createStepMutation.mutate,
    updateStep: updateStepMutation.mutate,
    deleteStep: deleteStepMutation.mutate,
    reorderSteps: reorderStepsMutation.mutate,
    isCreating: createStepMutation.isPending,
    isUpdating: updateStepMutation.isPending,
    isDeleting: deleteStepMutation.isPending,
    isReordering: reorderStepsMutation.isPending,
  };
};