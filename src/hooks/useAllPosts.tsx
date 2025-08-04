import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export type SortOption = 'recent' | 'pinned' | 'popular';

export const useAllPosts = (sortBy: SortOption = 'recent') => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['allPosts', user?.id, sortBy, currentCompanyId],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];

      let queryBuilder = supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_author_profile_fkey(first_name, last_name),
          spaces(name, type),
          post_interactions(id)
        `)
        .eq('company_id', currentCompanyId);

      let orderQuery;
      switch (sortBy) {
        case 'pinned':
          orderQuery = queryBuilder
            .order('is_pinned', { ascending: false })
            .order('is_announcement', { ascending: false })
            .order('created_at', { ascending: false });
          break;
        case 'popular':
          // For now, we'll order by created_at, but this could be enhanced with actual interaction counts
          orderQuery = queryBuilder
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false });
          break;
        case 'recent':
        default:
          orderQuery = queryBuilder
            .order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await orderQuery;

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentCompanyId,
  });
};