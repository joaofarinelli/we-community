import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export interface UserComment {
  id: string;
  comment_text: string;
  created_at: string;
  post_id: string;
  posts?: {
    title?: string;
    space_id: string;
    spaces?: {
      name: string;
      type: string;
    };
  };
}

export const useUserComments = (userId: string, limit = 10) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['user-comments', userId, currentCompanyId, limit],
    queryFn: async (): Promise<UserComment[]> => {
      if (!user || !userId || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from('post_interactions')
        .select(`
          id,
          comment_text,
          created_at,
          post_id,
          posts!post_interactions_post_id_fkey(
            title,
            space_id,
            spaces!posts_space_id_fkey(name, type)
          )
        `)
        .eq('user_id', userId)
        .eq('type', 'comment')
        .not('comment_text', 'is', null)
        .eq('posts.company_id', currentCompanyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user comments:', error);
        return [];
      }

      return (data || []).map((comment: any) => ({
        ...comment,
        posts: {
          ...(comment.posts as any)?.[0],
          spaces: (comment.posts as any)?.[0]?.spaces?.[0]
        }
      })) as UserComment[];
    },
    enabled: !!user && !!userId && !!currentCompanyId,
  });
};