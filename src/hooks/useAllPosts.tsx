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
      if (!user || !currentCompanyId) {
        console.log('🔍 useAllPosts: Missing user or company:', { user: !!user, currentCompanyId });
        return [];
      }

      console.log('🔍 useAllPosts: Fetching posts for user:', user.id, 'company:', currentCompanyId, 'sortBy:', sortBy);

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

      if (error) {
        console.error('❌ useAllPosts: Error fetching posts:', error);
        throw error;
      }

      console.log('✅ useAllPosts: Found', data?.length || 0, 'posts');
      return data || [];
    },
    enabled: !!user && !!currentCompanyId,
  });
};