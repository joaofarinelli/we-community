import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { toast } from '@/hooks/use-toast';

export interface BulkAction {
  id: string;
  name: string;
  description: string | null;
  action_type: 'notification' | 'announcement' | 'course_access' | 'space_access';
  action_config: any;
  audience_config: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface BulkActionExecution {
  id: string;
  bulk_action_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  total_targets: number;
  processed_count: number;
  success_count: number;
  error_count: number;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  executed_by: string;
  created_at: string;
}

export interface BulkActionResult {
  id: string;
  execution_id: string;
  user_id: string;
  status: 'success' | 'error';
  error_message: string | null;
  processed_at: string;
}

export interface BulkActionTarget {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export const useBulkActionsNew = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const { data: bulkActions, isLoading } = useQuery({
    queryKey: ['bulk-actions', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return [];

      const { data, error } = await supabase
        .from('bulk_actions')
        .select('*')
        .eq('company_id', currentCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BulkAction[];
    },
    enabled: !!currentCompanyId,
  });

  const createBulkAction = useMutation({
    mutationFn: async (data: Omit<BulkAction, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      if (!user?.id || !currentCompanyId) {
        throw new Error('User not authenticated or no company context');
      }

      const { data: result, error } = await supabase
        .from('bulk_actions')
        .insert({
          ...data,
          company_id: currentCompanyId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Ação em massa criada',
        description: 'A ação em massa foi criada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['bulk-actions'] });
    },
    onError: (error) => {
      console.error('Error creating bulk action:', error);
      toast({
        title: 'Erro ao criar ação',
        description: 'Ocorreu um erro ao criar a ação em massa.',
        variant: 'destructive',
      });
    },
  });

  const updateBulkAction = useMutation({
    mutationFn: async ({ id, ...data }: Partial<BulkAction> & { id: string }) => {
      if (!currentCompanyId) {
        throw new Error('No company context');
      }

      const { data: result, error } = await supabase
        .from('bulk_actions')
        .update(data)
        .eq('id', id)
        .eq('company_id', currentCompanyId)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Ação atualizada',
        description: 'A ação em massa foi atualizada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['bulk-actions'] });
    },
    onError: (error) => {
      console.error('Error updating bulk action:', error);
      toast({
        title: 'Erro ao atualizar ação',
        description: 'Ocorreu um erro ao atualizar a ação em massa.',
        variant: 'destructive',
      });
    },
  });

  const deleteBulkAction = useMutation({
    mutationFn: async (id: string) => {
      if (!currentCompanyId) {
        throw new Error('No company context');
      }

      const { error } = await supabase
        .from('bulk_actions')
        .delete()
        .eq('id', id)
        .eq('company_id', currentCompanyId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Ação removida',
        description: 'A ação em massa foi removida com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['bulk-actions'] });
    },
    onError: (error) => {
      console.error('Error deleting bulk action:', error);
      toast({
        title: 'Erro ao remover ação',
        description: 'Ocorreu um erro ao remover a ação em massa.',
        variant: 'destructive',
      });
    },
  });

  const executeBulkAction = useMutation({
    mutationFn: async (bulkActionId: string) => {
      if (!currentCompanyId) {
        throw new Error('No company context');
      }

      const { data, error } = await supabase.rpc('execute_bulk_action', {
        p_bulk_action_id: bulkActionId,
        p_company_id: currentCompanyId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Execução iniciada',
        description: 'A ação em massa foi executada com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['bulk-action-executions'] });
    },
    onError: (error) => {
      console.error('Error executing bulk action:', error);
      toast({
        title: 'Erro na execução',
        description: 'Ocorreu um erro ao executar a ação em massa.',
        variant: 'destructive',
      });
    },
  });

  return {
    bulkActions: bulkActions || [],
    isLoading,
    createBulkAction,
    updateBulkAction,
    deleteBulkAction,
    executeBulkAction,
  };
};

export const useBulkActionExecutions = (bulkActionId?: string) => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['bulk-action-executions', currentCompanyId, bulkActionId],
    queryFn: async () => {
      if (!currentCompanyId) return [];

      let query = supabase
        .from('bulk_action_executions')
        .select('*')
        .eq('company_id', currentCompanyId)
        .order('created_at', { ascending: false });

      if (bulkActionId) {
        query = query.eq('bulk_action_id', bulkActionId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as BulkActionExecution[];
    },
    enabled: !!currentCompanyId,
  });
};

export const useBulkActionResults = (executionId?: string) => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['bulk-action-results', currentCompanyId, executionId],
    queryFn: async () => {
      if (!currentCompanyId || !executionId) return [];

      const { data, error } = await supabase
        .from('bulk_action_results')
        .select(`
          *,
          profiles!inner(first_name, last_name, email)
        `)
        .eq('company_id', currentCompanyId)
        .eq('execution_id', executionId)
        .order('processed_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!currentCompanyId && !!executionId,
  });
};

export const useBulkActionTargets = (audienceConfig: any) => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['bulk-action-targets', currentCompanyId, audienceConfig],
    queryFn: async () => {
      if (!currentCompanyId || !audienceConfig) return [];

      const { data, error } = await supabase.rpc('get_bulk_action_targets', {
        p_company_id: currentCompanyId,
        p_audience_config: audienceConfig
      });

      if (error) throw error;
      return data as BulkActionTarget[];
    },
    enabled: !!currentCompanyId && !!audienceConfig,
  });
};

export const useBulkActionPreview = () => {
  const { currentCompanyId } = useCompanyContext();

  return useMutation({
    mutationFn: async (audienceConfig: any) => {
      if (!currentCompanyId) {
        throw new Error('No company context');
      }

      const { data, error } = await supabase.rpc('preview_bulk_action', {
        p_company_id: currentCompanyId,
        p_audience_config: audienceConfig
      });

      if (error) throw error;
      return data;
    },
  });
};