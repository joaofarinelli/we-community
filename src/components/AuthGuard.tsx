import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Loader2, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
        setCheckingStatus(false);
        return;
      }

      try {
        // Get any active profile for the user (since they might have multiple companies)
        const { data, error } = await supabase
          .from('profiles')
          .select('is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1);

        if (error) {
          console.error('Error checking user status:', error);
          setIsActive(true); // Default to active if error
        } else {
          // If user has at least one active profile, they're considered active
          setIsActive(data && data.length > 0);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        setIsActive(true); // Default to active if error
      } finally {
        setCheckingStatus(false);
      }
    };

    checkUserStatus();
  }, [user]);

  if (loading || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isActive === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <UserX className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Acesso Suspenso</h1>
          <p className="text-muted-foreground">
            Sua conta foi temporariamente suspensa. Entre em contato com o administrador para mais informações.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};