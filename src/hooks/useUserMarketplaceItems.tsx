import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface CreateUserItemData {
  category_id: string;
  name: string;
  description?: string;
  image_url?: string;
  price_coins: number;
  stock_quantity?: number;
}

export const useUserMarketplaceItems = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userMarketplaceItems', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('marketplace_items')
        .select(`
          *,
          marketplace_categories(name, color)
        `)
        .eq('seller_id', user.id)
        .eq('seller_type', 'user')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

export const useCreateUserMarketplaceItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateUserItemData) => {
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
          seller_id: user.id,
          seller_type: 'user',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('Item criado com sucesso!');
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