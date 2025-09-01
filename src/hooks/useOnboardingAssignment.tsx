import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

export interface OnboardingAssignment {
  id: string;
  flow_id: string;
  user_id: string;
  company_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OnboardingStepProgress {
  id: string;
  assignment_id: string;
  step_id: string;
  status: 'pending' | 'completed' | 'skipped';
  data: Record<string, any>;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export const useOnboardingAssignment = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const assignmentQuery = useQuery({
    queryKey: ['onboarding-assignment', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user || !currentCompanyId) return null;

      const { data, error } = await supabase
        .from('onboarding_assignments')
        .select(`
          *,
          onboarding_flows!inner(
            id,
            name,
            description,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .eq('company_id', currentCompanyId)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!currentCompanyId,
  });

  const progressQuery = useQuery({
    queryKey: ['onboarding-progress', assignmentQuery.data?.id],
    queryFn: async () => {
      if (!assignmentQuery.data?.id) return [];

      const { data, error } = await supabase
        .from('onboarding_step_progress')
        .select(`
          *,
          onboarding_steps!inner(
            id,
            step_type,
            title,
            description,
            order_index,
            config,
            is_required
          )
        `)
        .eq('assignment_id', assignmentQuery.data.id)
        .order('onboarding_steps(order_index)', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!assignmentQuery.data?.id,
  });

  const startAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { data, error } = await supabase
        .from('onboarding_assignments')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-assignment'] });
    },
  });

  const updateStepProgressMutation = useMutation({
    mutationFn: async ({
      stepId,
      status,
      data = {},
    }: {
      stepId: string;
      status: 'completed' | 'skipped';
      data?: Record<string, any>;
    }) => {
      if (!assignmentQuery.data?.id) throw new Error('Nenhum assignment ativo encontrado');

      const { data: stepProgress, error } = await supabase
        .from('onboarding_step_progress')
        .upsert({
          assignment_id: assignmentQuery.data.id,
          step_id: stepId,
          status,
          data,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return stepProgress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
    },
  });

  const completeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { data, error } = await supabase
        .from('onboarding_assignments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-assignment'] });
      toast.success('Parabéns! Você concluiu o onboarding!');
    },
  });

  const skipAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { data, error } = await supabase
        .from('onboarding_assignments')
        .update({
          status: 'skipped',
          completed_at: new Date().toISOString(),
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-assignment'] });
      toast.success('Onboarding ignorado');
    },
  });

  return {
    assignment: assignmentQuery.data,
    progress: progressQuery.data || [],
    isLoadingAssignment: assignmentQuery.isLoading,
    isLoadingProgress: progressQuery.isLoading,
    startAssignment: startAssignmentMutation.mutate,
    updateStepProgress: updateStepProgressMutation.mutate,
    completeAssignment: completeAssignmentMutation.mutate,
    skipAssignment: skipAssignmentMutation.mutate,
    isStarting: startAssignmentMutation.isPending,
    isUpdatingProgress: updateStepProgressMutation.isPending,
    isCompleting: completeAssignmentMutation.isPending,
    isSkipping: skipAssignmentMutation.isPending,
  };
};