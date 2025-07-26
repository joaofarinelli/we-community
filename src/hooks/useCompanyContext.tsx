import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useSubdomain } from './useSubdomain';
import { useCompany } from './useCompany';
import { supabase } from '@/integrations/supabase/client';

interface UserCompany {
  company_id: string;
  company_name: string;
  company_subdomain: string | null;
  company_custom_domain: string | null;
  company_logo_url: string | null;
  user_role: string;
  profile_created_at: string;
  user_id?: string; // Optional for extended query results
}

interface CompanyContextType {
  currentCompanyId: string | null;
  userCompanies: UserCompany[];
  isLoading: boolean;
  switchToCompany: (companyId: string) => void;
  createProfileForCompany: (companyId: string, firstName: string, lastName: string) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType>({
  currentCompanyId: null,
  userCompanies: [],
  isLoading: true,
  switchToCompany: () => {},
  createProfileForCompany: async () => {},
});

export const useCompanyContext = () => useContext(CompanyContext);

export const CompanyProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { data: currentCompany } = useCompany();
  const { subdomain, customDomain } = useSubdomain();
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);

  // Set current company ID based on subdomain/domain context
  useEffect(() => {
    if (currentCompany?.id) {
      setCurrentCompanyId(currentCompany.id);
    }
  }, [currentCompany]);

  // Fetch user's companies when user changes
  useEffect(() => {
    const fetchUserCompanies = async () => {
      if (!user?.id || !user?.email) {
        setUserCompanies([]);
        setIsLoading(false);
        return;
      }

      try {
        // First try the regular approach for the current user
        const { data: regularCompanies, error: regularError } = await supabase.rpc('get_user_companies', {
          p_user_id: user.id
        });

        if (regularError) {
          console.error('Error fetching user companies:', regularError);
        }

        // Also try the email-based approach for cross-domain access
        const { data: emailCompanies, error: emailError } = await supabase.rpc('get_user_accessible_companies', {
          p_user_email: user.email
        });

        if (emailError) {
          console.error('Error fetching companies by email:', emailError);
        }

        // Combine and deduplicate companies
        const allCompanies = [...(regularCompanies || []), ...(emailCompanies || [])];
        const uniqueCompanies = allCompanies.reduce((acc, current) => {
          const existing = acc.find(item => item.company_id === current.company_id);
          if (!existing) {
            acc.push(current);
          }
          return acc;
        }, [] as UserCompany[]);

        setUserCompanies(uniqueCompanies);
      } catch (error) {
        console.error('Error fetching user companies:', error);
        setUserCompanies([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserCompanies();
  }, [user]);

  const switchToCompany = (companyId: string) => {
    const company = userCompanies.find(c => c.company_id === companyId);
    if (!company) return;

    // Check if we need to authenticate as a different user for this company
    const currentUserId = user?.id;
    const targetUserId = (company as any).user_id; // From our extended query result

    if (targetUserId && currentUserId !== targetUserId) {
      // For cross-user access, we need to redirect with a special parameter
      // This would typically require a more sophisticated solution
      console.log('Cross-user company access detected', { currentUserId, targetUserId });
    }

    // Redirect to the company's domain
    const targetDomain = company.company_custom_domain || 
      (company.company_subdomain ? `${company.company_subdomain}.${window.location.hostname.split('.').slice(-2).join('.')}` : window.location.hostname);
    
    if (targetDomain !== window.location.hostname) {
      window.location.href = `${window.location.protocol}//${targetDomain}${window.location.pathname}`;
    }
  };

  const createProfileForCompany = async (companyId: string, firstName: string, lastName: string) => {
    if (!user?.id) throw new Error('User not authenticated');

    const { error } = await supabase.rpc('create_user_profile_for_company', {
      p_user_id: user.id,
      p_company_id: companyId,
      p_first_name: firstName,
      p_last_name: lastName,
      p_email: user.email
    });

    if (error) throw error;

    // Refresh user companies list
    const { data } = await supabase.rpc('get_user_companies', {
      p_user_id: user.id
    });
    setUserCompanies(data || []);
  };

  return (
    <CompanyContext.Provider value={{
      currentCompanyId,
      userCompanies,
      isLoading,
      switchToCompany,
      createProfileForCompany
    }}>
      {children}
    </CompanyContext.Provider>
  );
};