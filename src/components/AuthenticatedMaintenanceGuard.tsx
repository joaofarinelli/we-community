import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { MaintenancePage } from '@/pages/MaintenancePage';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { Navigate } from 'react-router-dom';

interface AuthenticatedMaintenanceGuardProps {
  children: ReactNode;
}

export const AuthenticatedMaintenanceGuard = ({ children }: AuthenticatedMaintenanceGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  
  // Domain-based company (e.g., subdomain/custom domain)
  const { data: domainCompany, isLoading: domainCompanyLoading } = useCompany();
  // Selected company in context (multi-company scenario)
  const { currentCompanyId } = useCompanyContext();

  const [resolvedCompany, setResolvedCompany] = useState<any | null>(null);
  const [companyResolving, setCompanyResolving] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isActive, setIsActive] = useState<boolean | null>(null);

  // Resolve which company to evaluate (prefer context selection when available)
  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      setCompanyResolving(true);

      try {
        if (currentCompanyId) {
          const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('id', currentCompanyId)
            .single();
          if (!cancelled) {
            if (error) {
              console.warn('AuthenticatedMaintenanceGuard: failed to load company by id', error);
              setResolvedCompany(null);
            } else {
              setResolvedCompany(data);
            }
          }
        } else {
          // Fallback to domain-based company
          setResolvedCompany(domainCompany ?? null);
        }
      } finally {
        if (!cancelled) setCompanyResolving(false);
      }
    };

    // Only start resolving when we have finished initial domainCompany loading
    if (!domainCompanyLoading) resolve();

    return () => {
      cancelled = true;
    };
  }, [currentCompanyId, domainCompany?.id, domainCompanyLoading]);

  const maintenanceEnabled = useMemo(
    () => Boolean((resolvedCompany as any)?.maintenance_mode),
    [resolvedCompany]
  );

  // Check user active status
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
        setIsActive(null);
        setCheckingStatus(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_active')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user status:', error);
          setIsActive(false);
        } else {
          setIsActive(data?.is_active ?? false);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        setIsActive(false);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkUserStatus();
  }, [user]);

  // Fetch user role ONLY if maintenance is enabled and user is authenticated
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchRole = async () => {
      if (!user || !maintenanceEnabled || !(resolvedCompany as any)?.id) {
        setUserRole(null);
        setRoleLoading(false);
        return;
      }
      setRoleLoading(true);
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .eq('company_id', (resolvedCompany as any).id)
          .eq('is_active', true)
          .single();
        if (!cancelled) {
          if (error) {
            console.error('AuthenticatedMaintenanceGuard: error fetching user role', error);
            setUserRole(null);
          } else {
            setUserRole(profile?.role || null);
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error('AuthenticatedMaintenanceGuard: unexpected error fetching role', e);
          setUserRole(null);
        }
      } finally {
        if (!cancelled) setRoleLoading(false);
      }
    };

    fetchRole();
    return () => {
      cancelled = true;
    };
  }, [user?.id, maintenanceEnabled, (resolvedCompany as any)?.id]);

  // Loading states
  if (authLoading || checkingStatus || domainCompanyLoading || companyResolving || (maintenanceEnabled && roleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If user is not logged in, redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user is not active, show suspended message
  if (isActive === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Suspenso</h1>
          <p className="text-muted-foreground">
            Sua conta foi temporariamente suspensa. Entre em contato com o suporte.
          </p>
        </div>
      </div>
    );
  }

  // If maintenance is OFF, allow normal rendering
  if (!maintenanceEnabled) {
    return <>{children}</>;
  }

  // If user is not admin/owner during maintenance, show maintenance page
  const isPrivileged = userRole === 'owner' || userRole === 'admin';
  if (!isPrivileged) {
    return <MaintenancePage />;
  }

  // Admins/owners can access normally during maintenance
  return <>{children}</>;
};