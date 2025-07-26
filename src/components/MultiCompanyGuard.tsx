import { useEffect, useState } from 'react';
import { useSubdomain } from '@/hooks/useSubdomain';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { CompanySelectionPage } from '@/pages/CompanySelectionPage';
import { CompanySelectionDialog } from '@/components/dashboard/CompanySelectionDialog';
import { Loader2 } from 'lucide-react';

interface MultiCompanyGuardProps {
  children: React.ReactNode;
}

export const MultiCompanyGuard = ({ children }: MultiCompanyGuardProps) => {
  const { subdomain, customDomain, isLoading: subdomainLoading } = useSubdomain();
  const { data: company, isLoading: companyLoading } = useCompany();
  const { user, loading: authLoading } = useAuth();
  const { userCompanies, isLoading: companyContextLoading, currentCompanyId, switchToCompany } = useCompanyContext();
  const [showCompanySelection, setShowCompanySelection] = useState(false);

  useEffect(() => {
    // Only redirect if we have a subdomain/custom domain but no company found AND user is authenticated
    if (!subdomainLoading && !companyLoading && (subdomain || customDomain) && !company && user) {
      console.log('No company found for subdomain/domain, redirecting to main domain');
      const baseDomain = window.location.hostname.split('.').slice(-2).join('.');
      const mainDomain = baseDomain.includes('localhost') ? 'localhost:5173' : baseDomain;
      window.location.href = `${window.location.protocol}//${mainDomain}${window.location.pathname}`;
      return;
    }

    // If user is authenticated and we have company context, check if user has access
    if (!authLoading && !companyContextLoading && user && company && userCompanies.length > 0) {
      const hasAccessToCompany = userCompanies.some(uc => uc.company_id === company.id);
      
      if (!hasAccessToCompany) {
        console.log('User does not have access to this company, redirecting to main domain');
        const baseDomain = window.location.hostname.split('.').slice(-2).join('.');
        const mainDomain = baseDomain.includes('localhost') ? 'localhost:5173' : baseDomain;
        window.location.href = `${window.location.protocol}//${mainDomain}${window.location.pathname}`;
        return;
      }
    }
  }, [subdomain, customDomain, company, user, userCompanies, currentCompanyId, subdomainLoading, companyLoading, authLoading, companyContextLoading]);

  // Show loading while we determine subdomain, company, or authentication state
  if (subdomainLoading || companyLoading || authLoading || companyContextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If we have a subdomain or custom domain but no company AND user is authenticated, show error and redirect
  if ((subdomain || customDomain) && !company && !companyLoading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Empresa não encontrada</h1>
          <p className="text-muted-foreground mb-4">
            {subdomain 
              ? `O subdomínio "${subdomain}" não está associado a nenhuma empresa.`
              : `O domínio "${customDomain}" não está configurado ou verificado.`
            }
          </p>
          <p className="text-sm text-muted-foreground">Redirecionando para a página principal...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated but we don't have a subdomain/custom domain, show company selection
  if (user && !subdomain && !customDomain && userCompanies.length > 0) {
    return <CompanySelectionPage />;
  }

  // If user is authenticated but has no companies, show empty state
  if (user && !subdomain && !customDomain && userCompanies.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Nenhuma empresa encontrada</h1>
          <p className="text-muted-foreground mb-6">
            Você ainda não tem acesso a nenhuma empresa. Entre em contato com um administrador para receber um convite.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <CompanySelectionDialog
        open={showCompanySelection}
        onClose={() => setShowCompanySelection(false)}
        onCompanySelect={(companyId) => {
          switchToCompany(companyId);
          setShowCompanySelection(false);
        }}
      />
    </>
  );
};