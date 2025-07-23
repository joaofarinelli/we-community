import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSpaceAccess = (spaceId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['spaceAccess', spaceId, user?.id],
    queryFn: async () => {
      if (!user || !spaceId) return { canSee: false, canAccess: false };

      // Check if user can see the space (will use RLS policies)
      const { data: spaceData, error: spaceError } = await supabase
        .from('spaces')
        .select('id, visibility')
        .eq('id', spaceId)
        .single();

      if (spaceError) {
        return { canSee: false, canAccess: false };
      }

      const canSee = !!spaceData;

      if (!canSee) {
        return { canSee: false, canAccess: false };
      }

      // For public spaces, seeing = accessing
      if (spaceData.visibility === 'public') {
        return { canSee: true, canAccess: true };
      }

      // For private/secret spaces, check membership
      const { data: memberData, error: memberError } = await supabase
        .from('space_members')
        .select('id')
        .eq('space_id', spaceId)
        .eq('user_id', user.id)
        .single();

      const isMember = !memberError && !!memberData;

      return { 
        canSee: true, 
        canAccess: isMember,
        visibility: spaceData.visibility
      };
    },
    enabled: !!user && !!spaceId,
  });
};