import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useMarketplaceItems = (categoryId?: string) => {
  return useQuery({
    queryKey: ['marketplaceItems', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_items')
        .select(`
          *,
          marketplace_categories(id, name, description, color),
          profiles:seller_id(first_name, last_name)
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};