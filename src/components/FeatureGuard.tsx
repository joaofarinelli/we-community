
import { Navigate } from "react-router-dom";
import { useIsFeatureEnabled, CompanyFeature } from "@/hooks/useCompanyFeatures";
import { Loader2 } from "lucide-react";
import { useCompanyFeatures } from "@/hooks/useCompanyFeatures";

interface FeatureGuardProps {
  feature: CompanyFeature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureGuard = ({ feature, children, fallback }: FeatureGuardProps) => {
  const { data: features, isLoading } = useCompanyFeatures();
  const isFeatureEnabled = useIsFeatureEnabled(feature);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isFeatureEnabled) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
