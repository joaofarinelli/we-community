import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useMarketplaceCategories = () => {
  return useQuery({
    queryKey: ['marketplaceCategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_categories')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      return data || [];
    },
  });
};