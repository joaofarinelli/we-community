import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export const useUserSpaces = (categoryId?: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['userSpaces', categoryId, user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

      let query = supabase
        .from('spaces')
        .select('*')
        .eq('company_id', currentCompanyId);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query.order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentCompanyId,
  });
};