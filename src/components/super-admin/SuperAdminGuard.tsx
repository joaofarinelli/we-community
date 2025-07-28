import { Navigate } from "react-router-dom";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Loader2 } from "lucide-react";

interface SuperAdminGuardProps {
  children: React.ReactNode;
}

export const SuperAdminGuard = ({ children }: SuperAdminGuardProps) => {
  const { data: isSuperAdmin, isLoading, error } = useSuperAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};