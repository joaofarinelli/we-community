import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/hooks/useCompanyContext';

interface ModerationResult {
  isRestricted: boolean;
  flaggedWords?: string[];
  confidence?: number;
}

export const useContentModeration = () => {
  const { currentCompanyId } = useCompanyContext();

  const moderateContent = useMutation({
    mutationFn: async ({
      content,
      contentType,
      postId,
      commentId
    }: {
      content: string;
      contentType: 'post' | 'comment';
      postId?: string;
      commentId?: string;
    }): Promise<ModerationResult> => {
      if (!currentCompanyId) {
        throw new Error('Company ID not found');
      }

      const { data, error } = await supabase.functions.invoke('moderate-content', {
        body: {
          content,
          contentType,
          postId,
          commentId,
          companyId: currentCompanyId
        }
      });

      if (error) {
        console.error('Moderation error:', error);
        // If moderation service fails, allow content but log the error
        return { isRestricted: false };
      }

      return data as ModerationResult;
    }
  });

  return {
    moderateContent: moderateContent.mutateAsync,
    isLoading: moderateContent.isPending
  };
};