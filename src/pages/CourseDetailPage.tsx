import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ModuleCard } from '@/components/courses/ModuleCard';
import { CourseRewardsSummary } from '@/components/courses/CourseRewardsSummary';
import { useCourses } from '@/hooks/useCourses';
import { useCourseModules } from '@/hooks/useCourseModules';
import { useCourseLessons } from '@/hooks/useCourseLessons';
import { useUserCourseProgress } from '@/hooks/useUserCourseProgress';
import { ArrowLeft, BookOpen, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const { data: courses } = useCourses();
  const { data: modules, isLoading: modulesLoading } = useCourseModules(courseId!);
  const { data: userProgress } = useUserCourseProgress(courseId);
  
  const course = courses?.find(c => c.id === courseId);

  const ModuleCardWithData = ({ module }: { module: any }) => {
    const { data: lessons } = useCourseLessons(module.id);
    const lessonCount = lessons?.length || 0;
    
    const completedLessons = userProgress?.filter(p => 
      p.module_id === module.id
    ).length || 0;
    
    const isCompleted = lessonCount > 0 && completedLessons === lessonCount;

    return (
      <ModuleCard
        module={module}
        lessonCount={lessonCount}
        completedLessons={completedLessons}
        isCompleted={isCompleted}
      />
    );
  };

  if (!course) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Curso não encontrado</h2>
          <p className="text-muted-foreground mb-4">
            O curso que você está procurando não existe ou foi removido.
          </p>
          <Button onClick={() => navigate('/courses')}>
            Voltar aos Cursos
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos Cursos
          </Button>
        </div>

        {/* Course Info */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row">
            {/* Course Image */}
            <div className="aspect-video w-full max-w-md overflow-hidden rounded-lg bg-muted lg:w-80">
              {course.thumbnail_url ? (
                <img 
                  src={course.thumbnail_url} 
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <BookOpen className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Course Details */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
                {course.description && (
                  <p className="mt-2 text-lg text-muted-foreground">
                    {course.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{modules?.length || 0} módulos</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress and Rewards */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Modules Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Módulos do Curso</h2>
          
          {modulesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-lg border p-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : modules && modules.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((module) => (
                <ModuleCardWithData key={module.id} module={module} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum módulo encontrado</h3>
              <p className="text-muted-foreground">
                Este curso ainda não possui módulos criados.
              </p>
            </div>
          )}
            </div>
          </div>

          {/* Rewards Sidebar */}
          <div className="lg:col-span-1">
            <CourseRewardsSummary 
              courseId={courseId!}
              totalLessons={modules?.reduce((total, module) => {
                // This would need to be calculated properly
                return total + 5; // Placeholder
              }, 0) || 0}
              totalModules={modules?.length || 0}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};