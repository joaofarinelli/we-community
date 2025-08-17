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

      let queryBuilder;
      let orderQuery;
      
      switch (sortBy) {
        case 'pinned':
          queryBuilder = supabase
            .from('posts')
            .select(`
              *,
              profiles!posts_author_profile_fkey(first_name, last_name, avatar_url),
              spaces(name, type),
              post_interactions(id)
            `)
            .eq('company_id', currentCompanyId);
          
          orderQuery = queryBuilder
            .order('is_pinned', { ascending: false })
            .order('is_announcement', { ascending: false })
            .order('created_at', { ascending: false });
          break;
          
        case 'popular':
          // Complex query to count interactions and sort by popularity
          const { data: postsWithCounts, error: countsError } = await supabase
            .from('posts')
            .select(`
              *,
              profiles!posts_author_profile_fkey(first_name, last_name, avatar_url),
              spaces(name, type),
              post_interactions(id)
            `)
            .eq('company_id', currentCompanyId);

          if (countsError) {
            console.error('❌ useAllPosts: Error fetching posts for popular sort:', countsError);
            throw countsError;
          }

          // Sort posts by interactions count, with pinned posts first
          const sortedPosts = (postsWithCounts || []).sort((a, b) => {
            // Pinned posts always come first
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            
            // Then announcements
            if (a.is_announcement && !b.is_announcement) return -1;
            if (!a.is_announcement && b.is_announcement) return 1;
            
            // Then by interaction count
            const aInteractions = a.post_interactions?.length || 0;
            const bInteractions = b.post_interactions?.length || 0;
            
            if (aInteractions !== bInteractions) {
              return bInteractions - aInteractions;
            }
            
            // Finally by creation date for posts with same interaction count
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });

          console.log('✅ useAllPosts: Found', sortedPosts.length, 'posts, sorted by popularity');
          return sortedPosts;
          
        case 'recent':
        default:
          queryBuilder = supabase
            .from('posts')
            .select(`
              *,
              profiles!posts_author_profile_fkey(first_name, last_name, avatar_url),
              spaces(name, type),
              post_interactions(id)
            `)
            .eq('company_id', currentCompanyId);
          
          orderQuery = queryBuilder
            .order('created_at', { ascending: false });
          break;
      }

      // For pinned and recent cases, execute the query
      if (sortBy === 'pinned' || sortBy === 'recent') {
        const { data, error } = await orderQuery;

        if (error) {
          console.error('❌ useAllPosts: Error fetching posts:', error);
          throw error;
        }

        console.log('✅ useAllPosts: Found', data?.length || 0, 'posts');
        return data || [];
      }

      // This should not be reached since popular case returns early
      return [];

    },
    enabled: !!user && !!currentCompanyId,
  });
};