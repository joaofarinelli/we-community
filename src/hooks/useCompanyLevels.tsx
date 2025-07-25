import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export const useCompanyLevels = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['companyLevels', currentCompanyId],
    queryFn: async () => {
      if (!user || !currentCompanyId) {
        console.log('useCompanyLevels: Missing user or company ID', { user: !!user, currentCompanyId });
        return [];
      }

      console.log('useCompanyLevels: Fetching levels for company', currentCompanyId);

      const { data, error } = await supabase
        .from('user_levels')
        .select('*')
        .eq('company_id', currentCompanyId)
        .order('level_number', { ascending: true });

      if (error) {
        console.error('useCompanyLevels: Error fetching levels', error);
        throw error;
      }
      
      console.log('useCompanyLevels: Fetched levels', data);
      return data || [];
    },
    enabled: !!user && !!currentCompanyId,
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: false,
  });
};