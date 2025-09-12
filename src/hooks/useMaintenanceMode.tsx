import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from './useCompany';
import { useToast } from '@/hooks/use-toast';

export const useMaintenanceMode = () => {
  const { data: company } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMaintenanceMode = useMutation({
    mutationFn: async ({ maintenanceMode, message }: { maintenanceMode: boolean; message?: string }) => {
      if (!company?.id) throw new Error('Company not found');

      const { error } = await supabase
        .from('companies')
        .update({
          maintenance_mode: maintenanceMode,
          maintenance_message: message || null
        })
        .eq('id', company.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast({
        title: "Modo de manutenção atualizado",
        description: "As configurações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating maintenance mode:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    },
  });

  return {
    company,
    isMaintenanceMode: (company as any)?.maintenance_mode || false,
    maintenanceMessage: (company as any)?.maintenance_message || null,
    updateMaintenanceMode: updateMaintenanceMode.mutate,
    isUpdating: updateMaintenanceMode.isPending,
  };
};