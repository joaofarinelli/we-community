import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubdomain } from './useSubdomain';

export const useCompany = () => {
  const { user } = useAuth();
  const { subdomain, customDomain } = useSubdomain();

  return useQuery({
    queryKey: ['company', subdomain, customDomain, user?.id],
    queryFn: async () => {
      // Priority 1: If we have a custom domain, fetch company by custom domain
      if (customDomain) {
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('custom_domain', customDomain)
          .eq('custom_domain_status', 'verified')
          .single();

        if (company) return company;
      }

      // Priority 2: If we have a subdomain, fetch company by subdomain
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
    enabled: !!subdomain || !!customDomain || !!user,
  });
};