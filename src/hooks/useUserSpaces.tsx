import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserSpaces = (categoryId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userSpaces', categoryId, user?.id],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('spaces')
        .select('*');

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query.order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};