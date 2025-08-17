import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export const useAvailableSpaces = (categoryId?: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['availableSpaces', categoryId, user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

      let query = supabase
        .from('spaces')
        .select(`
          *,
          space_members!left(
            role,
            joined_at,
            user_id
          ),
          space_categories(
            id,
            name
          )
        `)
        .eq('company_id', currentCompanyId);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query.order('order_index', { ascending: true });

      if (error) throw error;

      // Process the data to include membership information
      const processedData = data?.map(space => {
        const userMembership = space.space_members?.find(member => member.user_id === user.id);
        return {
          ...space,
          isMember: !!userMembership,
          userRole: userMembership?.role || null,
          memberCount: space.space_members?.length || 0,
          space_members: userMembership ? [userMembership] : []
        };
      }) || [];

      return processedData;
    },
    enabled: !!user && !!currentCompanyId,
  });
};