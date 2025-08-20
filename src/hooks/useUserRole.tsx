import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export const useUserRole = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['user-role', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId) {
        console.log('useUserRole: Missing user or company context, returning null');
        return null;
      }

      console.log('useUserRole: Setting context for company:', currentCompanyId);

      // Definir explicitamente o contexto da empresa antes da consulta
      await supabase.rpc('set_current_company_context', {
        p_company_id: currentCompanyId
      });

      console.log('useUserRole: Fetching role for user:', user.id, 'in company:', currentCompanyId);

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', currentCompanyId)
        .maybeSingle();

      if (error) {
        console.error('useUserRole: Error fetching user role:', error);
        throw error;
      }

      console.log('useUserRole: Successfully fetched role:', data?.role);
      return data;
    },
    enabled: !!user?.id && !!currentCompanyId,
    retry: 0,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useIsAdmin = () => {
  const { data: userRole } = useUserRole();
  return userRole?.role === 'admin' || userRole?.role === 'owner';
};