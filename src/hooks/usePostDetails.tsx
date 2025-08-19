import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompanyContext } from './useCompanyContext';

export interface PostDetails {
  id: string;
  title?: string;
  content: string;
  type: string;
  is_pinned: boolean;
  is_announcement: boolean;
  created_at: string;
  updated_at: string;
  space_id: string;
  author_id: string;
  spaces?: {
    name: string;
    type: string;
  };
  profiles?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export const usePostDetails = (postId: string, spaceId: string) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['post-details', postId, spaceId, currentCompanyId],
    queryFn: async (): Promise<PostDetails | null> => {
      if (!user || !postId || !spaceId || !currentCompanyId) return null;

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
          updated_at,
          space_id,
          author_id,
          spaces!posts_space_id_fkey(name, type),
          profiles!posts_author_profile_fkey(first_name, last_name, avatar_url)
        `)
        .eq('id', postId)
        .eq('space_id', spaceId)
        .eq('company_id', currentCompanyId)
        .single();

      if (error) {
        console.error('Error fetching post details:', error);
        return null;
      }

      return data;
    },
    enabled: !!user && !!postId && !!spaceId && !!currentCompanyId,
  });
};