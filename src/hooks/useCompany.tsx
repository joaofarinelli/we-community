import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubdomain } from './useSubdomain';

export const useCompany = () => {
  const { user } = useAuth();
  const { subdomain, customDomain } = useSubdomain();

  return useQuery({
    queryKey: ['company', subdomain, customDomain, user?.id, localStorage.getItem('preferredCompanyId')],
    queryFn: async () => {
      // Priority 1: If we have a custom domain, fetch company by custom domain
      if (customDomain) {
        console.log('Searching for company with custom domain:', customDomain);
        
        // First try with verified status
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('custom_domain', customDomain)
          .eq('custom_domain_status', 'verified')
          .single();

        if (company) {
          console.log('Found verified company:', company.name);
          return company;
        }

        // Fallback for development/editor: try without verification requirement
        const { data: unverifiedCompany } = await supabase
          .from('companies')
          .select('*')
          .eq('custom_domain', customDomain)
          .single();

        if (unverifiedCompany) {
          console.log('Found unverified company:', unverifiedCompany.name);
          return unverifiedCompany;
        }

        // If no custom domain match, try as subdomain (extract prefix)
        const knownBaseDomains = ['weplataforma.com.br', 'yourplatform.com'];
        const matchingBaseDomain = knownBaseDomains.find(baseDomain => customDomain.endsWith(baseDomain));
        
        if (matchingBaseDomain && customDomain !== matchingBaseDomain) {
          const prefix = customDomain.replace('.' + matchingBaseDomain, '').replace(matchingBaseDomain, '');
          
          if (prefix && !prefix.includes('.')) {
            console.log('Trying as subdomain:', prefix);
            const { data: subdomainCompany } = await supabase
              .from('companies')
              .select('*')
              .eq('subdomain', prefix)
              .single();

            if (subdomainCompany) {
              console.log('Found company by subdomain:', subdomainCompany.name);
              return subdomainCompany;
            }
          }
        }
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

      // Get all user companies and find the best match for current domain
      const { data: userCompanies } = await supabase.rpc('get_user_companies', {
        p_user_id: user.id
      });

      if (!userCompanies || userCompanies.length === 0) {
        // Try email-based lookup for cross-domain access
        const { data: emailCompanies } = await supabase.rpc('get_user_accessible_companies', {
          p_user_email: user.email
        });

        if (emailCompanies && emailCompanies.length > 0) {
          // Check for preferred company
          const preferredCompanyId = localStorage.getItem('preferredCompanyId');
          const preferredCompany = emailCompanies.find(c => c.company_id === preferredCompanyId);
          
          if (preferredCompany) {
            const { data: companyDetails } = await supabase.rpc('get_company_details_for_user', {
              p_company_id: preferredCompany.company_id
            });
            return companyDetails?.[0] || null;
          }

          // Use first available company
          const { data: companyDetails } = await supabase.rpc('get_company_details_for_user', {
            p_company_id: emailCompanies[0].company_id
          });
          return companyDetails?.[0] || null;
        }
        return null;
      }

      // Check for preferred company
      const preferredCompanyId = localStorage.getItem('preferredCompanyId');
      if (preferredCompanyId) {
        const hasAccess = userCompanies.some(uc => uc.company_id === preferredCompanyId);
        if (hasAccess) {
          const { data: companyDetails } = await supabase.rpc('get_company_details_for_user', {
            p_company_id: preferredCompanyId
          });
          return companyDetails?.[0] || null;
        }
      }

      // If user has only one company, return it
      if (userCompanies.length === 1) {
        const { data: companyDetails } = await supabase.rpc('get_company_details_for_user', {
          p_company_id: userCompanies[0].company_id
        });
        return companyDetails?.[0] || null;
      }

      // If user has multiple companies, try to find the most appropriate one
      // Priority: 1. Recent access preference 2. First created profile
      const selectedCompany = userCompanies[0]; // For now, use the first one (ordered by created_at DESC)
      
      const { data: companyDetails } = await supabase.rpc('get_company_details_for_user', {
        p_company_id: selectedCompany.company_id
      });
      return companyDetails?.[0] || null;
    },
    enabled: !!subdomain || !!customDomain || !!user,
  });
};