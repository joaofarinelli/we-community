import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useSubdomain } from './useSubdomain';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DomainAuthData {
  shouldRedirectToLogin: boolean;
  isValidating: boolean;
  targetCompany: any;
  requiredUserId: string | null;
}

export const useDomainAuth = (): DomainAuthData => {
  const { user, loading: authLoading } = useAuth();
  const { subdomain, customDomain, isLoading: subdomainLoading } = useSubdomain();
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [targetCompany, setTargetCompany] = useState<any>(null);
  const [requiredUserId, setRequiredUserId] = useState<string | null>(null);

  // Aggressive session cleanup function
  const forceSessionCleanup = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear specific Supabase keys if they still exist
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('Forced session cleanup completed');
    } catch (error) {
      console.error('Error during forced cleanup:', error);
    }
  };

  useEffect(() => {
    const validateDomainAccess = async () => {
      if (authLoading || subdomainLoading) return;

      setIsValidating(true);

      try {
        const hostname = window.location.hostname;
        let domainCompany = null;

        // Check if we're on a specific domain (not the main SaaS domain)
        if (subdomain || customDomain) {
          // Try to find company by custom domain first
          if (customDomain) {
            console.log('Looking for company with custom_domain:', customDomain);
            const { data: customDomainCompany, error } = await supabase
              .from('companies')
              .select('*')
              .eq('custom_domain', customDomain)
              .single();
            
            if (error) {
              console.log('Custom domain query error:', error);
            }
            domainCompany = customDomainCompany;
          }

          // Try by subdomain if custom domain didn't match
          if (!domainCompany && subdomain) {
            const { data: subdomainCompany } = await supabase
              .from('companies')
              .select('*')
              .eq('subdomain', subdomain)
              .single();
            domainCompany = subdomainCompany;
          }
        }

        setTargetCompany(domainCompany);

        // If we found a domain-specific company
        if (domainCompany) {
          console.log('Domain validation - Found target company:', domainCompany.name);
          
          if (!user) {
            // Not logged in, need to login
            console.log('User not logged in, redirecting to login');
            setShouldRedirectToLogin(true);
            setIsValidating(false);
            return;
          }

          // Check if user has access to this company
          const { data: userProfiles } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', user.email)
            .eq('company_id', domainCompany.id);

          if (!userProfiles || userProfiles.length === 0) {
            // User doesn't have access to this company
            console.log('User does not have access to domain company');
            
            // Force aggressive session cleanup
            await forceSessionCleanup();
            
            toast({
              variant: "destructive",
              title: "Acesso negado",
              description: `Você não tem acesso à ${domainCompany.name}. Entre em contato com um administrador.`,
            });
            setShouldRedirectToLogin(true);
            setIsValidating(false);
            return;
          }

          const correctProfile = userProfiles[0];
          setRequiredUserId(correctProfile.user_id);

          // Check if current user_id matches the required one for this domain
          if (user.id !== correctProfile.user_id) {
            console.log('User ID mismatch for domain. Required:', correctProfile.user_id, 'Current:', user.id);
            
            // Force aggressive session cleanup
            await forceSessionCleanup();
            
            toast({
              variant: "destructive",
              title: "Sessão incorreta",
              description: `Você precisa fazer login novamente para acessar ${domainCompany.name}.`,
            });
            setShouldRedirectToLogin(true);
            setIsValidating(false);
            return;
          }

          console.log('Domain validation passed - User has correct access');
        } else if (user && (subdomain || customDomain)) {
          // We have a subdomain/custom domain but no company found
          console.log('Domain has no associated company, signing out');
          await forceSessionCleanup();
          setShouldRedirectToLogin(true);
          setIsValidating(false);
          return;
        }

        // All checks passed
        setShouldRedirectToLogin(false);
      } catch (error) {
        console.error('Domain validation error:', error);
        setShouldRedirectToLogin(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateDomainAccess();
  }, [user, subdomain, customDomain, authLoading, subdomainLoading]);

  return {
    shouldRedirectToLogin,
    isValidating,
    targetCompany,
    requiredUserId
  };
};