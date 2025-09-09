import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleCard } from '@/components/courses/ModuleCard';
import { PageBanner } from '@/components/ui/page-banner';
import { useCourseModules } from '@/hooks/useCourseModules';
import { useCourseLessons } from '@/hooks/useCourseLessons';
import { useUserCourseProgress } from '@/hooks/useUserCourseProgress';
import { useModuleAccess } from '@/hooks/useCourseAccess';
import { useCourses } from '@/hooks/useCourses';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ModuleAccessGuard } from '@/components/courses/ModuleAccessGuard';

const ModuleCardWithAccess = ({ module, courseId }: { module: any; courseId: string }) => {
  const { data: lessons } = useCourseLessons(module.id);
  const { data: userProgress } = useUserCourseProgress(courseId);
  const { data: moduleAccess } = useModuleAccess(courseId);
  
  const lessonCount = lessons?.length || 0;
  const completedLessons = userProgress?.filter(p => 
    lessons?.some(lesson => lesson.id === p.lesson_id) && p.completed_at
  ).length || 0;
  
  const isCompleted = lessonCount > 0 && completedLessons === lessonCount;
  const isLocked = moduleAccess && !moduleAccess[module.id];
  
  return (
    <ModuleCard
      module={module}
      lessonCount={lessonCount}
      completedLessons={completedLessons}
      isCompleted={isCompleted}
      isLocked={isLocked}
      lockReason={isLocked ? "Complete o módulo anterior" : ""}
    />
  );
};

export const ModuleListPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { data: courses } = useCourses();
  const { data: modules, isLoading } = useCourseModules(courseId || '');
  
  const course = courses?.find(c => c.id === courseId);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageBanner bannerType="courses" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!modules || modules.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/courses')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Cursos
            </Button>
          </div>
          <PageBanner bannerType="courses" />
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-muted-foreground">
              Nenhum módulo disponível
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Os módulos aparecerão aqui quando forem adicionados ao curso.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/courses')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Cursos
          </Button>
        </div>
        
        <PageBanner bannerType="courses" />
        
        <div>
          <h1 className="text-2xl font-bold mb-2">
            {course?.title || 'Módulos do Curso'}
          </h1>
          <p className="text-muted-foreground">
            {course?.description || 'Explore os módulos disponíveis neste curso.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <ModuleCardWithAccess 
              key={module.id} 
              module={module} 
              courseId={courseId || ''} 
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};