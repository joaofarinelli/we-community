import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useOtherUserMarketplaceItems = (userId: string) => {
  return useQuery({
    queryKey: ['otherUserMarketplaceItems', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('marketplace_items')
        .select(`
          *,
          marketplace_categories(name, color)
        `)
        .eq('seller_id', userId)
        .eq('seller_type', 'user')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};