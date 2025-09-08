import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useCompanyContext } from './useCompanyContext';
import { useAcceptMarketplaceTerms } from './useMarketplaceTerms';

interface CreateUserItemData {
  category_id: string;
  name: string;
  description?: string;
  image_url?: string;
  price_coins: number;
  stock_quantity?: number;
  item_type?: string;
  digital_delivery_url?: string;
  terms_acceptance?: {
    terms_id: string;
  };
}

export const useUserMarketplaceItems = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['userMarketplaceItems', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('marketplace_items')
        .select(`
          *,
          marketplace_categories(name, color)
        `)
        .eq('seller_id', user.id)
        .eq('seller_type', 'user')
        .eq('company_id', currentCompanyId)
        .eq('store_type', 'marketplace')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!currentCompanyId,
  });
};

export const useCreateUserMarketplaceItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const acceptTermsMutation = useAcceptMarketplaceTerms();

  return useMutation({
    mutationFn: async (data: CreateUserItemData) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!currentCompanyId) throw new Error('Company context not available');

      const { terms_acceptance, ...itemData } = data;

      const { data: result, error } = await supabase
        .from('marketplace_items')
        .insert({
          ...itemData,
          company_id: currentCompanyId,
          created_by: user.id,
          seller_id: user.id,
          seller_type: 'user',
          store_type: 'marketplace',
          // moderation_status defaults to 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Accept terms if provided
      if (terms_acceptance?.terms_id) {
        await acceptTermsMutation.mutateAsync({
          itemId: result.id,
          termsId: terms_acceptance.terms_id,
        });
      }

      return result;
    },
    onSuccess: () => {
      toast.success('Item enviado para análise! Você será notificado quando for aprovado.');
      queryClient.invalidateQueries({ queryKey: ['userMarketplaceItems'] });
      queryClient.invalidateQueries({ queryKey: ['marketplaceItems'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar item');
    },
  });
};

export const useUpdateUserMarketplaceItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateUserItemData> }) => {
      const { data: result, error } = await supabase
        .from('marketplace_items')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('Item atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['userMarketplaceItems'] });
      queryClient.invalidateQueries({ queryKey: ['marketplaceItems'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar item');
    },
  });
};

export const useDeleteUserMarketplaceItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketplace_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Item excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['userMarketplaceItems'] });
      queryClient.invalidateQueries({ queryKey: ['marketplaceItems'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir item');
    },
  });
};