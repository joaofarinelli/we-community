import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubdomain } from './useSubdomain';

export const useCompanyByDomain = () => {
  const { subdomain, customDomain } = useSubdomain();

  return useQuery({
    queryKey: ['company-by-domain', subdomain, customDomain],
    queryFn: async () => {
      const hostname = window.location.hostname;
      console.log('Looking for company with hostname:', hostname, 'subdomain:', subdomain, 'customDomain:', customDomain);
      
      // Use the new domain lookup function
      const domainToSearch = customDomain || subdomain || hostname;
      
      if (domainToSearch && domainToSearch !== 'development-fallback') {
        console.log('🔍 Using find_company_by_domain for:', domainToSearch);
        
        try {
          const { data, error } = await supabase
            .rpc('find_company_by_domain', { p_domain: domainToSearch });
          
          if (data && data.length > 0) {
            console.log('✅ Found company by domain:', data[0].name, 'ID:', data[0].id);
            return data[0];
          }
          
          if (error) {
            console.log('⚠️ Domain lookup error:', error.message);
          } else {
            console.log('⚠️ No company found for domain:', domainToSearch);
          }
        } catch (err) {
          console.error('❌ Error in domain lookup:', err);
        }
      }
      
      // Fallback for development
      if (customDomain === 'development-fallback') {
        console.log('Using development fallback - searching for first active company');
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();
        
        if (data && !error) {
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