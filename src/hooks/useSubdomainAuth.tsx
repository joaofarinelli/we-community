import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { useSubdomain } from './useSubdomain';
import { useCompany } from './useCompany';
import { supabase } from '@/integrations/supabase/client';
import { buildSubdomainUrl } from '@/lib/subdomainUtils';

export const useSubdomainAuth = () => {
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();
  const { subdomain } = useSubdomain();
  const { data: company } = useCompany();

  useEffect(() => {
    const handleSubdomainRedirection = async () => {
      // If user is logged in but we have a subdomain that doesn't match their company
      if (user && userProfile && subdomain && company) {
        if (userProfile.company_id !== company.id) {
          // Get user's company subdomain and redirect
          const { data: userCompany } = await supabase
            .from('companies')
            .select('subdomain')
            .eq('id', userProfile.company_id)
            .single();
          
          if (userCompany?.subdomain) {
            const redirectUrl = buildSubdomainUrl(userCompany.subdomain, window.location.pathname);
            window.location.href = redirectUrl;
          }
        }
      }

      // If user just logged in and we're on the main domain (no subdomain), redirect to their company
      if (user && userProfile && !subdomain) {
        const { data: userCompany } = await supabase
          .from('companies')
          .select('subdomain')
          .eq('id', userProfile.company_id)
          .single();
        
        if (userCompany?.subdomain) {
          const redirectUrl = buildSubdomainUrl(userCompany.subdomain, '/dashboard');
          window.location.href = redirectUrl;
        }
      }
    };

    handleSubdomainRedirection();
  }, [user, userProfile, subdomain, company]);

  return {
    user,
    userProfile,
    subdomain,
    company,
    isCorrectSubdomain: company && userProfile ? company.id === userProfile.company_id : true
  };
};