import { ReactNode, useEffect, useState } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { MaintenancePage } from '@/pages/MaintenancePage';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface MaintenanceGuardProps {
  children: ReactNode;
}

export const MaintenanceGuard = ({ children }: MaintenanceGuardProps) => {
  const { data: company, isLoading: companyLoading } = useCompany();
  const { user, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // Fetch user role when user and company are available
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user || !company?.id) {
        setUserRole(null);
        setRoleLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .eq('company_id', company.id)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
        } else {
          setUserRole(profile?.role || null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      } finally {
        setRoleLoading(false);
      }
    };

    fetchUserRole();
  }, [user, company?.id]);

  // Show loading while data is being fetched
  if (companyLoading || authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If company is not in maintenance mode, show normal content
  if (!(company as any)?.maintenance_mode) {
    return <>{children}</>;
  }

  // If user is not logged in and company is in maintenance, show maintenance page
  if (!user) {
    return <MaintenancePage />;
  }

  // If user is logged in but doesn't have admin/owner role, show maintenance page
  if (userRole !== 'owner' && userRole !== 'admin') {
    return <MaintenancePage />;
  }

  // User has admin/owner role, allow access even during maintenance
  return <>{children}</>;
};