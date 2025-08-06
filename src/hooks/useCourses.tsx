import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { useSupabaseContext } from '@/hooks/useSupabaseContext';

export const useCourses = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  useSupabaseContext();

  return useQuery({
    queryKey: ['courses', user?.id, currentCompanyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('company_id', currentCompanyId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!currentCompanyId,
  });
};