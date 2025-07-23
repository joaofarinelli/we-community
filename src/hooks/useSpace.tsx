import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSpace = (spaceId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['space', spaceId, user?.id],
    queryFn: async () => {
      if (!user || !spaceId) return null;

      const { data, error } = await supabase
        .from('spaces')
        .select(`
          *,
          space_categories(name)
        `)
        .eq('id', spaceId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!spaceId,
  });
};