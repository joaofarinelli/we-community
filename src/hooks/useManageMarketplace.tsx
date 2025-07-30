import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface CreateCategoryData {
  name: string;
  description?: string;
  icon_value?: string;
  color?: string;
}

interface CreateItemData {
  category_id: string;
  name: string;
  description?: string;
  image_url?: string;
  price_coins: number;
  stock_quantity?: number;
  is_featured?: boolean;
  store_type?: string;
  seller_type?: string;
}

export const useCreateMarketplaceCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateCategoryData) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get user's company ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('User company not found');

      const { data: result, error } = await supabase
        .from('marketplace_categories')
        .insert({
          ...data,
          company_id: profile.company_id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('Categoria criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['marketplaceCategories'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar categoria');
    },
  });
};

export const useUpdateMarketplaceCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateCategoryData> }) => {
      const { data: result, error } = await supabase
        .from('marketplace_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('Categoria atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['marketplaceCategories'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar categoria');
    },
  });
};

export const useDeleteMarketplaceCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketplace_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Categoria excluída com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['marketplaceCategories'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir categoria');
    },
  });
};

export const useCreateMarketplaceItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateItemData) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get user's company ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('User company not found');

      const { data: result, error } = await supabase
        .from('marketplace_items')
        .insert({
          ...data,
          company_id: profile.company_id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('Item criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['marketplaceItems'] });
      queryClient.invalidateQueries({ queryKey: ['storeItems'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar item');
    },
  });
};

export const useUpdateMarketplaceItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateItemData> }) => {
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
      queryClient.invalidateQueries({ queryKey: ['marketplaceItems'] });
      queryClient.invalidateQueries({ queryKey: ['storeItems'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar item');
    },
  });
};

export const useDeleteMarketplaceItem = () => {
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
      queryClient.invalidateQueries({ queryKey: ['marketplaceItems'] });
      queryClient.invalidateQueries({ queryKey: ['storeItems'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir item');
    },
  });
};