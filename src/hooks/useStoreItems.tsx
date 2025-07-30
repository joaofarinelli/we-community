import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useStoreItems = (categoryId?: string) => {
  return useQuery({
    queryKey: ['storeItems', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_items')
        .select(`
          *,
          marketplace_categories(id, name, description, color),
          profiles:seller_id(first_name, last_name)
        `)
        .eq('is_active', true)
        .eq('store_type', 'store')
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