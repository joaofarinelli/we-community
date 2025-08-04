import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type SortOption = 'recent' | 'pinned' | 'popular';

export const useAllPosts = (sortBy: SortOption = 'recent') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['allPosts', user?.id, sortBy],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_author_profile_fkey(first_name, last_name),
          spaces(name, type),
          post_interactions(id)
        `);

      let orderQuery;
      switch (sortBy) {
        case 'pinned':
          orderQuery = query
            .order('is_pinned', { ascending: false })
            .order('is_announcement', { ascending: false })
            .order('created_at', { ascending: false });
          break;
        case 'popular':
          // For now, we'll order by created_at, but this could be enhanced with actual interaction counts
          orderQuery = query
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false });
          break;
        case 'recent':
        default:
          orderQuery = query
            .order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await orderQuery;

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};