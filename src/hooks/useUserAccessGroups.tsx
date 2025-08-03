import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export const useUserAccessGroups = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['user-access-groups', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('access_group_members')
        .select(`
          access_group_id,
          access_groups!inner(
            id,
            name,
            description
          )
        `)
        .eq('user_id', user.id)
        .eq('company_id', currentCompanyId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentCompanyId,
  });
};

export const useUserSpaceAccess = (spaceId?: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['user-space-access', user?.id, spaceId, currentCompanyId],
    queryFn: async () => {
      if (!user || !spaceId || !currentCompanyId) return false;

      // Check if user has access to this space through access groups
      const { data, error } = await supabase
        .from('access_group_members')
        .select(`
          access_group_id,
          access_group_spaces!inner(
            space_id
          )
        `)
        .eq('user_id', user.id)
        .eq('company_id', currentCompanyId)
        .eq('access_group_spaces.space_id', spaceId);

      if (error) throw error;
      return (data && data.length > 0) || false;
    },
    enabled: !!user && !!spaceId && !!currentCompanyId,
  });
};