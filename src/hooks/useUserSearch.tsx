import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserSearch = (searchTerm: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userSearch', searchTerm],
    queryFn: async () => {
      if (!user || searchTerm.length < 2) return [];

      // Get user's company ID first
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .eq('company_id', profile.company_id)
        .neq('user_id', user.id) // Exclude current user
        .eq('is_active', true)
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: searchTerm.length >= 2,
  });
};