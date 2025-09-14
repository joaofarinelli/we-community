import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export interface UserPost {
  id: string;
  title?: string;
  content: string;
  type: string;
  is_pinned: boolean;
  is_announcement: boolean;
  created_at: string;
  space_id: string;
  spaces?: {
    name: string;
    type: string;
  };
}

export const useUserPosts = (userId: string, limit = 10) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['user-posts', userId, currentCompanyId, limit],
    queryFn: async (): Promise<UserPost[]> => {
      if (!user || !userId || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          type,
          is_pinned,
          is_announcement,
          created_at,
          space_id,
          spaces!posts_space_id_fkey(name, type)
        `)
        .eq('author_id', userId)
        .eq('company_id', currentCompanyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user posts:', error);
        return [];
      }

      return (data || []).map((post: any) => ({
        ...post,
        spaces: (post.spaces as any)?.[0] || { name: '', type: '' }
      })) as UserPost[];
    },
    enabled: !!user && !!userId && !!currentCompanyId,
  });
};

export const useUserStats = (userId: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['user-stats', userId, currentCompanyId],
    queryFn: async () => {
      if (!user || !userId || !currentCompanyId) return { postsCount: 0, commentsCount: 0 };

      // Count posts
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId)
        .eq('company_id', currentCompanyId);

      // Count comments
      const { count: commentsCount } = await supabase
        .from('post_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'comment')
        .not('comment_text', 'is', null);

      return {
        postsCount: postsCount || 0,
        commentsCount: commentsCount || 0
      };
    },
    enabled: !!user && !!userId && !!currentCompanyId,
  });
};