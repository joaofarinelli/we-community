import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from './useCompanyContext';
import { toast } from 'sonner';

export const useTMBProductSync = () => {
  const queryClient = useQueryClient();
  const { currentCompanyId } = useCompanyContext();

  return useMutation({
    mutationFn: async () => {
      if (!currentCompanyId) {
        throw new Error('Contexto da empresa não disponível');
      }

      const { data, error } = await supabase.functions.invoke('tmb-sync-products', {
        body: { companyId: currentCompanyId }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      console.log('TMB Sync Result:', data);
      
      const { synced_count, updated_count, errors } = data.data;
      
      if (errors && errors.length > 0) {
        toast.warning(`Sincronização parcial: ${synced_count} criados, ${updated_count} atualizados. ${errors.length} erros encontrados.`);
      } else {
        toast.success(`Produtos sincronizados: ${synced_count} criados, ${updated_count} atualizados.`);
      }
      
      // Invalidar queries relacionadas aos produtos TMB
      queryClient.invalidateQueries({ queryKey: ['tmbProducts'] });
      queryClient.invalidateQueries({ queryKey: ['tmbProductCategories'] });
      // Manter as antigas para compatibilidade
      queryClient.invalidateQueries({ queryKey: ['marketplaceItems'] });
      queryClient.invalidateQueries({ queryKey: ['storeItems'] });
    },
    onError: (error: any) => {
      console.error('TMB Sync Error:', error);
      toast.error(error.message || 'Erro ao sincronizar produtos TMB');
    },
  });
};