import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useStoreCategories = () => {
  return useQuery({
    queryKey: ['storeCategories'],
    queryFn: async () => {
      // First, get all active categories
      const { data: categories, error: categoriesError } = await supabase
        .from('marketplace_categories')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (categoriesError) throw categoriesError;

      // Then check which ones have store items
      const categoriesWithItems = [];
      for (const category of categories || []) {
        const { data: items, error: itemsError } = await supabase
          .from('marketplace_items')
          .select('id')
          .eq('category_id', category.id)
          .eq('store_type', 'store')
          .eq('is_active', true)
          .limit(1);

        if (!itemsError && items && items.length > 0) {
          categoriesWithItems.push(category);
        }
      }
      
      return categoriesWithItems;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - categories change less frequently
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });
};