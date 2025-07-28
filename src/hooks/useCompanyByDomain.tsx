import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubdomain } from './useSubdomain';

export const useCompanyByDomain = () => {
  const { subdomain, customDomain } = useSubdomain();

  return useQuery({
    queryKey: ['company-by-domain', subdomain, customDomain],
    queryFn: async () => {
      console.log('Looking for company with subdomain:', subdomain, 'customDomain:', customDomain);
      
      // If we have a custom domain and it's not the development fallback, look for that first
      if (customDomain && customDomain !== 'development-fallback') {
        console.log('Searching by custom domain:', customDomain);
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('custom_domain', customDomain)
          .single();
        
        if (!error && data) {
          console.log('Found company by custom domain:', data.name);
          return data;
        }
        console.log('No company found by custom domain, error:', error?.message);
      }
      
      // If we have a subdomain, look for that
      if (subdomain) {
        console.log('Searching by subdomain:', subdomain);
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('subdomain', subdomain)
          .single();
        
        if (!error && data) {
          console.log('Found company by subdomain:', data.name);
          return data;
        }
        console.log('No company found by subdomain, error:', error?.message);
      }
      
      // Development fallback: get the first active company
      if (customDomain === 'development-fallback') {
        console.log('Using development fallback - searching for first company');
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('status', 'active')
          .limit(1)
          .single();
        
        if (!error && data) {
          console.log('Found company via development fallback:', data.name);
          return data;
        }
        console.log('No company found via development fallback, error:', error?.message);
      }
      
      console.log('No company found for this domain');
      return null;
    },
    enabled: !!(subdomain || customDomain),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};