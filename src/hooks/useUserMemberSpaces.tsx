import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserMemberSpaces = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userMemberSpaces', user?.id],
    queryFn: async () => {
      if (!user) return [];

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
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching user member spaces:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });
};