import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from './useCompanyContext';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ModerationAction {
  status: 'approved' | 'rejected';
  notes?: string;
}

export const usePendingMarketplaceItems = () => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['pendingMarketplaceItems', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return [];

      const { data, error } = await supabase
        .from('marketplace_items')
        .select(`
          *,
          marketplace_categories(name, color)
        `)
        .eq('company_id', currentCompanyId)
        .eq('store_type', 'marketplace')
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentCompanyId,
  });
};

export const useModerateMarketplaceItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      itemId, 
      action 
    }: { 
      itemId: string; 
      action: ModerationAction;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('marketplace_items')
        .update({
          moderation_status: action.status,
          moderated_by: user.id,
          moderated_at: new Date().toISOString(),
          moderation_notes: action.notes || null,
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      const actionText = variables.action.status === 'approved' ? 'aprovado' : 'rejeitado';
      toast.success(`Item ${actionText} com sucesso!`);
      
      queryClient.invalidateQueries({ queryKey: ['pendingMarketplaceItems'] });
      queryClient.invalidateQueries({ queryKey: ['marketplaceItems'] });
      queryClient.invalidateQueries({ queryKey: ['userMarketplaceItems'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao moderar item');
    },
  });
};

export const useAllMarketplaceItemsForModeration = () => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['allMarketplaceItemsForModeration', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return [];

      const { data, error } = await supabase
        .from('marketplace_items')
        .select(`
          *,
          marketplace_categories(name, color)
        `)
        .eq('company_id', currentCompanyId)
        .eq('store_type', 'marketplace')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentCompanyId,
  });
};