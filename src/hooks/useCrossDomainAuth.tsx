import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface CrossDomainAuthContextType {
  availableAccounts: Array<{
    email: string;
    user_id: string;
    company_id: string;
    company_name: string;
    company_subdomain: string | null;
    company_custom_domain: string | null;
    user_role: string;
  }>;
  switchToAccount: (user_id: string, company_id: string) => Promise<void>;
  isLoading: boolean;
}

const CrossDomainAuthContext = createContext<CrossDomainAuthContextType>({
  availableAccounts: [],
  switchToAccount: async () => {},
  isLoading: true,
});

export const useCrossDomainAuth = () => useContext(CrossDomainAuthContext);

export const CrossDomainAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [availableAccounts, setAvailableAccounts] = useState<CrossDomainAuthContextType['availableAccounts']>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableAccounts = async () => {
      if (!user?.email) {
        setAvailableAccounts([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data: accounts, error } = await supabase.rpc('get_user_accessible_companies', {
          p_user_email: user.email
        });

        if (error) {
          console.error('Error fetching available accounts:', error);
          setAvailableAccounts([]);
        } else {
          // Map the response to match our interface
          const mappedAccounts = (accounts || []).map(acc => ({
            email: user.email || '',
            user_id: acc.user_id,
            company_id: acc.company_id,
            company_name: acc.company_name,
            company_subdomain: acc.company_subdomain,
            company_custom_domain: acc.company_custom_domain,
            user_role: acc.user_role
          }));
          setAvailableAccounts(mappedAccounts);
        }
      } catch (error) {
        console.error('Error fetching available accounts:', error);
        setAvailableAccounts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableAccounts();
  }, [user?.email]);

  const switchToAccount = async (user_id: string, company_id: string) => {
    const account = availableAccounts.find(acc => acc.user_id === user_id && acc.company_id === company_id);
    if (!account) return;

    // Store the target account info for cross-domain authentication
    sessionStorage.setItem('crossDomainAuth', JSON.stringify({
      targetUserId: user_id,
      targetCompanyId: company_id,
      targetEmail: account.email,
      redirectAfterAuth: true
    }));

    // Navigate to the target company domain
    const targetDomain = account.company_custom_domain || 
      (account.company_subdomain ? `${account.company_subdomain}.${window.location.hostname.split('.').slice(-2).join('.')}` : window.location.hostname);
    
    // Don't redirect to lovable.dev or other development domains
    const isLovableDomain = targetDomain?.includes('lovable.dev') || targetDomain?.includes('lovable.co');
    const currentDomain = window.location.hostname;
    
    if (targetDomain && targetDomain !== currentDomain && !isLovableDomain) {
      window.location.href = `${window.location.protocol}//${targetDomain}/auth?action=cross-domain`;
    } else {
      // Same domain or lovable domain - implement local company switching
      console.log('Switching to company on same domain:', account.company_name);
      
      // Store the target company preference
      localStorage.setItem('preferredCompanyId', account.company_id);
      localStorage.setItem('preferredUserId', account.user_id);
      
      // Reload the page to trigger company context refresh
      window.location.reload();
    }
  };

  return (
    <CrossDomainAuthContext.Provider value={{
      availableAccounts,
      switchToAccount,
      isLoading,
    }}>
      {children}
    </CrossDomainAuthContext.Provider>
  );
};