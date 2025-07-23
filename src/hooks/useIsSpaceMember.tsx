import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useIsSpaceMember = (spaceId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['isSpaceMember', spaceId, user?.id],
    queryFn: async () => {
      if (!user || !spaceId) return { isMember: false, role: null };

      const { data, error } = await supabase
        .from('space_members')
        .select('role')
        .eq('space_id', spaceId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        return { isMember: false, role: null };
      }

      return { 
        isMember: true, 
        role: data.role 
      };
    },
    enabled: !!user && !!spaceId,
  });
};