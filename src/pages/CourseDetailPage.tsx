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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-background">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative px-8 py-12">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/courses')}
              className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar aos Cursos
            </Button>
            
            <div className="max-w-4xl">
              <h1 className="text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
                  {course.description}
                </p>
              )}
              
              <div className="flex items-center gap-8 mt-8 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <span className="font-medium">{modules?.length || 0} módulos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Duração estimada: {modules?.length * 2 || 0}h</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Showcase */}
        <div className="px-8 py-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Módulos do Curso</h2>
            <p className="text-muted-foreground">Explore o conteúdo organizado por módulos</p>
          </div>
          
          {modulesLoading ? (
            <div className="flex gap-6 overflow-x-auto pb-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-none w-80 h-48 rounded-xl border bg-card p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-6" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : modules && modules.length > 0 ? (
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
              {modules.map((module) => (
                <ModuleCardWithData key={module.id} module={module} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhum módulo encontrado</h3>
              <p className="text-muted-foreground max-w-md">
                Este curso ainda não possui módulos criados. Volte em breve para ver o conteúdo disponível.
              </p>
            </div>
          )}
        </div>

        {/* Course Rewards Summary */}
        <div className="px-8 pb-12">
          <div className="max-w-md">
            <CourseRewardsSummary 
              courseId={courseId!}
              totalLessons={modules?.reduce((total, module) => {
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