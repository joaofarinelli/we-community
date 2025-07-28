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
        console.log('🔍 Searching by custom domain:', customDomain);
        
        try {
          // First try verified custom domains with explicit query
          console.log('🔍 Trying verified custom domain query...');
          const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('custom_domain', customDomain)
            .eq('custom_domain_status', 'verified')
            .eq('status', 'active')
            .maybeSingle();
          
          if (data && !error) {
            console.log('✅ Found company by verified custom domain:', data.name, 'ID:', data.id);
            return data;
          }
          
          console.log('⚠️ No verified custom domain found, error:', error?.message);
          
          // If no verified domain found, try unverified but active
          console.log('🔍 Trying unverified custom domain query...');
          const { data: unverifiedData, error: unverifiedError } = await supabase
            .from('companies')
            .select('*')
            .eq('custom_domain', customDomain)
            .eq('status', 'active')
            .maybeSingle();
          
          if (unverifiedData && !unverifiedError) {
            console.log('✅ Found company by custom domain (unverified):', unverifiedData.name, 'ID:', unverifiedData.id);
            return unverifiedData;
          }
          
          console.log('❌ No company found by custom domain, error:', unverifiedError?.message);
        } catch (err) {
          console.error('❌ Error searching by custom domain:', err);
        }
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
      
      // Development fallback: get the first active company (ONLY for development)
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