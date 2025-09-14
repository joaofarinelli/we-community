import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useCheckProductAccess = (productId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['productAccess', productId, user?.id],
    queryFn: async () => {
      if (!user?.id || !productId) return false;

      // Get product access tags
      const { data: product, error: productError } = await supabase
        .from('marketplace_items')
        .select('access_tags')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // If no access tags, everyone can buy
      if (!product.access_tags || product.access_tags.length === 0) {
        return true;
      }

      // Get user tags
      const { data: userTags, error: tagsError } = await supabase
        .from('user_tags')
        .select('tag_id, tags(name)')
        .eq('user_id', user.id);

      if (tagsError) throw tagsError;

      // Check if user has any of the required tags
      const userTagNames = (userTags as any)?.map((ut: any) => ut.tags?.name).filter(Boolean) || [];
      const hasAccess = product.access_tags.some((requiredTag: any) => 
        userTagNames.includes(requiredTag)
      );

      return hasAccess;
    },
    enabled: !!user?.id && !!productId,
    staleTime: 30000, // Cache for 30 seconds
  });
};