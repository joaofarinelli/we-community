import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';
import { ensureCompanyContext } from '@/lib/ensureCompanyContext';

export const useUserRole = (contextReady = true) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['user-role', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId) {
        console.debug('useUserRole: Missing user or company context, returning null');
        return null;
      }

      console.debug('useUserRole: Starting query for user:', user.id, 'in company:', currentCompanyId);

      // Ensure company context is set before the query
      await ensureCompanyContext(currentCompanyId);

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', currentCompanyId)
        .maybeSingle();

      if (error) {
        console.error('useUserRole: Error fetching user role:', error);
        // Handle "no rows returned" as null instead of error
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      console.debug('useUserRole: Successfully fetched role:', data?.role);
      return data;
    },
    enabled: !!user?.id && !!currentCompanyId && contextReady,
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useIsAdmin = () => {
  const { data: userRole } = useUserRole();
  return userRole?.role === 'admin' || userRole?.role === 'owner';
};