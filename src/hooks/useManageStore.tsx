import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useCompanyContext } from './useCompanyContext';

interface CreateStoreItemData {
  category_id: string;
  name: string;
  description?: string;
  image_url?: string;
  price_coins: number;
  stock_quantity?: number;
  is_featured?: boolean;
  access_tags?: string[];
  item_type?: string;
  digital_delivery_url?: string;
  store_type: 'store';
  seller_type: 'company';
}

export const useCreateStoreItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useMutation({
    mutationFn: async (data: CreateStoreItemData) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!currentCompanyId) throw new Error('Company context not available');

      const { data: result, error } = await supabase
        .from('marketplace_items')
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
      toast.success('Produto da loja criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['storeItems'] });
      queryClient.invalidateQueries({ queryKey: ['storeCategories'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar produto da loja');
    },
  });
};

export const useUpdateStoreItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateStoreItemData> }) => {
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
      toast.success('Produto da loja atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['storeItems'] });
      queryClient.invalidateQueries({ queryKey: ['storeCategories'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar produto da loja');
    },
  });
};