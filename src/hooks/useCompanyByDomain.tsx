import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubdomain } from './useSubdomain';

export const useCompanyByDomain = () => {
  const { subdomain, customDomain } = useSubdomain();

  return useQuery({
    queryKey: ['company-by-domain', subdomain, customDomain],
    queryFn: async () => {
      // If we have a custom domain, look for that first
      if (customDomain) {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('custom_domain', customDomain)
          .single();
        
        if (!error && data) {
          return data;
        }
      }
      
      // If we have a subdomain, look for that
      if (subdomain) {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('subdomain', subdomain)
          .single();
        
        if (!error && data) {
          return data;
        }
      }
      
      // No company found for this domain
      return null;
    },
    enabled: !!(subdomain || customDomain),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};