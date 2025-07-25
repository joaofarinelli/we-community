import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserMemberSpaces = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userMemberSpaces', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get spaces where user is a member OR public spaces the user can see
      const { data, error } = await supabase
        .from('spaces')
        .select(`
          *,
          space_members!inner(
            role,
            joined_at
          ),
          space_categories(
            id,
            name
          )
        `)
        .eq('space_members.user_id', user.id)
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