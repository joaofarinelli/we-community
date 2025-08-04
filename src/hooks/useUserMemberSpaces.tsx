import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export const useUserMemberSpaces = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['userMemberSpaces', user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

      // Get all spaces the user can see (relies on RLS policy with can_user_see_space)
      // This now includes spaces accessible through access groups
      const { data, error } = await supabase
        .from('spaces')
        .select(`
          *,
          space_members!left(
            role,
            joined_at
          ),
          space_categories(
            id,
            name
          )
        `)
        .eq('company_id', currentCompanyId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching user member spaces:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user && !!currentCompanyId,
  });
};