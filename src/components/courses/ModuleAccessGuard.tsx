import { useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModuleAccess } from '@/hooks/useCourseAccess';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface ModuleAccessGuardProps {
  courseId: string;
  moduleId: string;
  children: ReactNode;
  redirectTo?: string;
  showLoading?: boolean;
}

export const ModuleAccessGuard = ({ 
  courseId, 
  moduleId, 
  children, 
  redirectTo,
  showLoading = true 
}: ModuleAccessGuardProps) => {
  const navigate = useNavigate();
  const { data: moduleAccess, isLoading } = useModuleAccess(courseId);

  useEffect(() => {
    if (!isLoading && moduleAccess && moduleId && moduleAccess[moduleId] === false) {
      toast.error('Você precisa completar o módulo anterior para acessar este conteúdo');
      
      // Redirect to the appropriate page
      if (redirectTo) {
        navigate(redirectTo);
      } else {
        navigate(`/courses/${courseId}`);
      }
    }
  }, [moduleAccess, moduleId, isLoading, navigate, courseId, redirectTo]);

  // Show loading skeleton while checking access
  if (isLoading && showLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  // If access is denied, don't render children
  if (!isLoading && moduleAccess && moduleId && moduleAccess[moduleId] === false) {
    return null;
  }

  // If access is granted or not restricted, render children
  return <>{children}</>;
};