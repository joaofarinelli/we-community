import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';

export interface CompanyUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
}

export const useCompanyUsers = (searchQuery?: string) => {
  const { user } = useAuth();
  const { data: company } = useCompany();

  return useQuery({
    queryKey: ['company-users', company?.id, searchQuery],
    queryFn: async () => {
      if (!company?.id) return [];

      let query = supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .eq('company_id', company.id);

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
    enabled: !!company?.id,
  });
};