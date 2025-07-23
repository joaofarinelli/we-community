import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useMarketplacePurchases = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['marketplacePurchases', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('marketplace_purchases')
        .select(`
          *,
          marketplace_items(name, image_url)
        `)
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

export const usePurchaseItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, quantity = 1 }: { itemId: string; quantity?: number }) => {
      const { data, error } = await supabase.rpc('process_marketplace_purchase', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_company_id: null, // Will be handled by the function using get_user_company_id()
        p_item_id: itemId,
        p_quantity: quantity,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.success) {
        toast.success('Compra realizada com sucesso!');
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['marketplacePurchases'] });
        queryClient.invalidateQueries({ queryKey: ['userCoins'] });
        queryClient.invalidateQueries({ queryKey: ['marketplaceItems'] });
      } else {
        toast.error(data?.error || 'Erro ao processar compra');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao processar compra');
    },
  });
};