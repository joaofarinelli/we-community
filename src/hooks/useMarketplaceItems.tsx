import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useMarketplaceItems = (categoryId?: string) => {
  return useQuery({
    queryKey: ['marketplaceItems', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_items')
        .select(`
          id,
          name,
          description,
          image_url,
          price_coins,
          stock_quantity,
          category_id,
          seller_id,
          seller_type,
          access_tags,
          is_featured,
          is_active,
          order_index,
          created_at
        `)
        .eq('is_active', true)
        .eq('store_type', 'marketplace')
        .order('order_index');

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};