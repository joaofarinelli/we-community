import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useStoreCategories = () => {
  return useQuery({
    queryKey: ['storeCategories'],
    queryFn: async () => {
      // Get categories that have store items
      const { data, error } = await supabase
        .from('marketplace_categories')
        .select(`
          *,
          marketplace_items!inner(id)
        `)
        .eq('is_active', true)
        .eq('marketplace_items.store_type', 'store')
        .eq('marketplace_items.is_active', true)
        .order('order_index');

      if (error) throw error;
      
      // Remove duplicates and return unique categories
      const uniqueCategories = data?.reduce((acc, item) => {
        const existingCategory = acc.find(cat => cat.id === item.id);
        if (!existingCategory) {
          const { marketplace_items, ...category } = item;
          acc.push(category);
        }
        return acc;
      }, [] as any[]) || [];
      
      return uniqueCategories;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - categories change less frequently
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });
};