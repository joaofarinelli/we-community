import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useCompanyLevels = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['companyLevels'],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_levels')
        .select('*')
        .order('level_number', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: false,
  });
};