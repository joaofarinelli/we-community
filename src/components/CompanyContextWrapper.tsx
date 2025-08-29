import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { useSupabaseContext } from '@/hooks/useSupabaseContext';

interface CompanyContextWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper que garante que o contexto da empresa seja estabelecido
 * antes de renderizar os componentes filhos
 */
export const CompanyContextWrapper = ({ children }: CompanyContextWrapperProps) => {
  const { user, loading: authLoading } = useAuth();
  const { currentCompanyId, isLoading: companyLoading, userCompanies } = useCompanyContext();
  const [isContextReady, setIsContextReady] = useState(false);
  
  // Use the Supabase context hook to set up company context
  useSupabaseContext();

  useEffect(() => {
    // Context is ready when:
    // 1. Auth is not loading
    // 2. Company context is not loading
    // 3. Either user is not logged in OR we have a current company ID
    const contextReady = !authLoading && 
                        !companyLoading && 
                        (!user || (user && currentCompanyId));
    
    if (contextReady) {
      // Add a small delay to ensure all context setup is complete
      const timer = setTimeout(() => {
        setIsContextReady(true);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setIsContextReady(false);
    }
  }, [authLoading, companyLoading, user, currentCompanyId]);

  // Show loading state while context is being established
  if (!isContextReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando contexto...</p>
          {user && userCompanies.length > 0 && !currentCompanyId && (
            <p className="text-sm text-muted-foreground">
              Configurando empresa ({userCompanies.length} disponível{userCompanies.length > 1 ? 'eis' : ''})
            </p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};