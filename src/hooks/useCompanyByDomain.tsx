import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubdomain } from './useSubdomain';

export const useCompanyByDomain = () => {
  const { subdomain, customDomain } = useSubdomain();

  return useQuery({
    queryKey: ['company-by-domain', subdomain, customDomain],
    queryFn: async () => {
      const hostname = window.location.hostname;
      console.log('🔍 useCompanyByDomain: Original hostname:', hostname, 'subdomain:', subdomain, 'customDomain:', customDomain);
      
      // Use the new domain lookup function
      const domainToSearch = customDomain || subdomain || hostname;
      console.log('🔍 useCompanyByDomain: Searching for domain:', domainToSearch);
      
      if (domainToSearch && domainToSearch !== 'development-fallback') {
        console.log('🔍 useCompanyByDomain: Using find_company_by_domain for:', domainToSearch);
        
        try {
          const { data, error } = await supabase
            .rpc('find_company_by_domain', { p_domain: domainToSearch });
          
          if (data && data.length > 0) {
            console.log('✅ useCompanyByDomain: Found company by domain:', data[0].name, 'ID:', data[0].id, 'subdomain:', data[0].subdomain);
            return data[0];
          }
          
          if (error) {
            console.log('⚠️ useCompanyByDomain: Domain lookup error:', error.message);
          } else {
            console.log('⚠️ useCompanyByDomain: No company found for domain:', domainToSearch);
          }
        } catch (err) {
          console.error('❌ useCompanyByDomain: Error in domain lookup:', err);
        }
      }
      
      // Fallback for development
      if (customDomain === 'development-fallback') {
        console.log('🔧 useCompanyByDomain: Using development fallback - searching for first active company');
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();
        
        if (data && !error) {
          console.log('✅ useCompanyByDomain: Found company via development fallback:', data.name);
          return data;
        }
        console.log('⚠️ useCompanyByDomain: No company found via development fallback, error:', error?.message);
      }
      
      console.log('❌ useCompanyByDomain: No company found for this domain');
      return null;
    },
    enabled: true, // Always enabled, let the function handle logic
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};