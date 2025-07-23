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
          marketplace_categories!inner(*)
        `)
        .eq('is_active', true)
        .order('order_index');

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });
};