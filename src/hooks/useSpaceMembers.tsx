import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSpaceMembers = (spaceId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['spaceMembers', spaceId, user?.id],
    queryFn: async () => {
      if (!user || !spaceId) return [];

      const { data, error } = await supabase
        .from('space_members')
        .select(`
          *,
          profiles!space_members_user_id_fkey(first_name, last_name)
        `)
        .eq('space_id', spaceId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!spaceId,
  });
};