import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SuperAdminConfig {
  id: string;
  config_key: string;
  config_value: any;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const useSuperAdminConfigs = () => {
  return useQuery({
    queryKey: ['super-admin-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('super_admin_configs')
        .select('*')
        .order('config_key');

      if (error) throw error;
      return data as SuperAdminConfig[];
    },
  });
};

export const useBugReportsConfig = () => {
  return useQuery({
    queryKey: ['super-admin-config', 'bug_reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('super_admin_configs')
        .select('*')
        .eq('config_key', 'bug_reports')
        .single();

      if (error) {
        // If config doesn't exist, return default
        if (error.code === 'PGRST116') {
          return {
            config_key: 'bug_reports',
            config_value: { email: null, enabled: true },
            description: 'Configurações para relatórios de bugs'
          };
        }
        throw error;
      }
      
      return data as SuperAdminConfig;
    },
  });
};

export const useUpdateSuperAdminConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      configKey, 
      configValue, 
      description 
    }: { 
      configKey: string; 
      configValue: any; 
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from('super_admin_configs')
        .upsert({
          config_key: configKey,
          config_value: configValue,
          description
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-configs'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-config'] });
      toast.success('Configuração atualizada com sucesso');
    },
    onError: (error: any) => {
      console.error('Error updating super admin config:', error);
      toast.error('Erro ao atualizar configuração: ' + error.message);
    },
  });
};