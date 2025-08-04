import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export const useUserSearch = (searchTerm: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['userSearch', searchTerm, currentCompanyId],
    queryFn: async () => {
      if (!user || searchTerm.length < 2 || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .eq('company_id', currentCompanyId)
        .neq('user_id', user.id) // Exclude current user
        .eq('is_active', true)
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: searchTerm.length >= 2 && !!currentCompanyId,
  });
};