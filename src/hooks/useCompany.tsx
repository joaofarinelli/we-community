import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubdomain } from './useSubdomain';

export const useCompany = () => {
  const { user } = useAuth();
  const { subdomain } = useSubdomain();

  return useQuery({
    queryKey: ['company', subdomain, user?.id],
    queryFn: async () => {
      // If we have a subdomain, fetch company by subdomain
      if (subdomain) {
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('subdomain', subdomain)
          .single();

        return company;
      }

      // Fallback to user-based company lookup for backwards compatibility
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.company_id) return null;

      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();

      return company;
    },
    enabled: !!subdomain || !!user,
  });
};