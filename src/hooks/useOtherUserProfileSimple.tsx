import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from './useCompanyContext';

export const useOtherUserProfileSimple = (userId?: string) => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['otherUserProfileSimple', userId, currentCompanyId],
    queryFn: async () => {
      if (!userId || !currentCompanyId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', userId)
        .eq('company_id', currentCompanyId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!currentCompanyId,
  });
};