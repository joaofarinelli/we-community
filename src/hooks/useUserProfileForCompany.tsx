import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export const useUserProfileForCompany = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['userProfileForCompany', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId) return null;

      const { data, error } = await supabase.rpc('get_user_profile_for_company', {
        p_user_id: user.id,
        p_company_id: currentCompanyId
      });

      if (error) {
        console.error('Error fetching user profile for company:', error);
        throw error;
      }

      return data?.[0] || null;
    },
    enabled: !!user?.id && !!currentCompanyId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
};