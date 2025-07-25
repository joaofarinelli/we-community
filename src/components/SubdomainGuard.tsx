import { useEffect } from 'react';
import { useSubdomain } from '@/hooks/useSubdomain';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface SubdomainGuardProps {
  children: React.ReactNode;
}

export const SubdomainGuard = ({ children }: SubdomainGuardProps) => {
  const { subdomain, isLoading: subdomainLoading } = useSubdomain();
  const { data: company, isLoading: companyLoading } = useCompany();
  const { user, loading: authLoading } = useAuth();
  const { data: userProfile } = useUserProfile();

  useEffect(() => {
    // If we have a subdomain but no company found, redirect to main domain
    if (!subdomainLoading && !companyLoading && subdomain && !company) {
      const mainDomain = window.location.hostname.split('.').slice(-2).join('.');
      window.location.href = `${window.location.protocol}//${mainDomain}`;
      return;
    }

    // If user is authenticated but doesn't belong to this company, redirect to their company's subdomain
    if (!authLoading && !subdomainLoading && !companyLoading && user && userProfile && company && subdomain) {
      if (userProfile.company_id !== company.id) {
        // Find the user's company and redirect to its subdomain
        const redirectToUserCompany = async () => {
          const { data: userCompany } = await supabase
            .from('companies')
            .select('subdomain')
            .eq('id', userProfile.company_id)
            .single();
          
          if (userCompany?.subdomain) {
            const baseDomain = window.location.hostname.split('.').slice(-2).join('.');
            window.location.href = `${window.location.protocol}//${userCompany.subdomain}.${baseDomain}${window.location.pathname}`;
          }
        };
        
        redirectToUserCompany();
        return;
      }
    }
  }, [subdomain, company, user, userProfile, subdomainLoading, companyLoading, authLoading]);

  // Show loading while we're checking subdomain and company
  if (subdomainLoading || companyLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If we have a subdomain but no company, don't render children (will redirect)
  if (subdomain && !company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Empresa não encontrada</h1>
          <p className="text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};