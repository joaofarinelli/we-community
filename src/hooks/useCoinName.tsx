import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from './useCompanyContext';

export const useCoinName = () => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['coinName', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return 'WomanCoins';

      const { data: company, error } = await supabase
        .from('companies')
        .select('coin_name')
        .eq('id', currentCompanyId)
        .single();

      if (error) throw error;
      return company?.coin_name || 'WomanCoins';
    },
    enabled: !!currentCompanyId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};