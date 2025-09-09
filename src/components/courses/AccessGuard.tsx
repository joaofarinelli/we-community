import { useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModuleAccess } from '@/hooks/useCourseAccess';
import { toast } from 'sonner';

interface AccessGuardProps {
  courseId: string;
  moduleId: string;
  children: ReactNode;
  redirectTo?: string;
}

export const AccessGuard = ({ courseId, moduleId, children, redirectTo }: AccessGuardProps) => {
  const navigate = useNavigate();
  const { data: moduleAccess, isLoading } = useModuleAccess(courseId);

  useEffect(() => {
    if (!isLoading && moduleAccess && moduleAccess[moduleId] === false) {
      toast.error('Você precisa completar o módulo anterior para acessar este conteúdo');
      
      // Redirect to the appropriate page
      if (redirectTo) {
        navigate(redirectTo);
      } else {
        navigate(`/courses/${courseId}`);
      }
    }
  }, [moduleAccess, moduleId, isLoading, navigate, courseId, redirectTo]);

  // If still loading access data, don't render anything yet
  if (isLoading) {
    return null;
  }

  // If access is denied, don't render children
  if (moduleAccess && moduleAccess[moduleId] === false) {
    return null;
  }

  // If access is granted or not restricted, render children
  return <>{children}</>;
};