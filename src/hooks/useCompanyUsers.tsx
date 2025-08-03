import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export interface CompanyUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  role: string;
  created_at: string;
}

export const useCompanyUsers = (searchQuery?: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['company-users', currentCompanyId, searchQuery],
    queryFn: async () => {
      if (!currentCompanyId) return [];

      let query = supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, role, created_at')
        .eq('company_id', currentCompanyId)
        .eq('is_active', true);

      if (searchQuery && searchQuery.length > 0) {
        const searchTerm = `%${searchQuery}%`;
        query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`);
      }

      const { data, error } = await query.limit(10);

      if (error) {
        console.error('Error fetching company users:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!currentCompanyId,
  });
};