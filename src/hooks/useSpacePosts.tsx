import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSpacePosts = (spaceId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['spacePosts', spaceId, user?.id],
    queryFn: async () => {
      if (!user || !spaceId) return [];

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_author_id_fkey(first_name, last_name)
        `)
        .eq('space_id', spaceId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!spaceId,
  });
};