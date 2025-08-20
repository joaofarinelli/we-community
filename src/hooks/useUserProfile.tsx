import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { ensureCompanyContext } from '@/lib/ensureCompanyContext';

export const useUserProfile = (contextReady = true) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['userProfile', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId) return null;

      console.debug('useUserProfile: Starting query for user:', user.id, 'in company:', currentCompanyId);

      // Ensure company context is set before the query
      await ensureCompanyContext(currentCompanyId);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('company_id', currentCompanyId)
        .maybeSingle();

      if (error) {
        console.error('useUserProfile: Error fetching user profile:', error);
        // Handle "no rows returned" as null instead of error
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      console.debug('useUserProfile: Successfully fetched profile for user:', user.id);
      return profile;
    },
    enabled: !!user?.id && !!currentCompanyId && contextReady,
    staleTime: 30000,
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};