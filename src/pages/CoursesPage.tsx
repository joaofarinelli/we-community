import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CourseCard } from '@/components/courses/CourseCard';
import { ModuleCard } from '@/components/courses/ModuleCard';
import { CourseBannerSection } from '@/components/courses/CourseBannerSection';
import { useCourses } from '@/hooks/useCourses';
import { useCourseModules } from '@/hooks/useCourseModules';
import { useCourseLessons } from '@/hooks/useCourseLessons';
import { useUserCourseProgress } from '@/hooks/useUserCourseProgress';
import { Search, BookOpen, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const CoursesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: courses, isLoading } = useCourses();
  const { data: userProgress } = useUserCourseProgress();

  const filteredCourses = courses?.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const ModuleCardWithData = ({ module, courseId }: { module: any; courseId: string }) => {
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

  const CourseSection = ({ course }: { course: any }) => {
    const { data: modules } = useCourseModules(course.id);
    
    return (
      <div className="space-y-6">
        {/* Course Header */}
        <div className="space-y-4">
          <div>
            <h2 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              {course.title}
            </h2>
            {course.description && (
              <p className="text-lg text-muted-foreground max-w-3xl">
                {course.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="font-medium">{modules?.length || 0} módulos</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Duração estimada: {(modules?.length || 0) * 2}h</span>
            </div>
          </div>
        </div>

        {/* Modules Horizontal Scroll */}
        {modules && modules.length > 0 ? (
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {modules.map((module) => (
              <ModuleCardWithData 
                key={module.id} 
                module={module} 
                courseId={course.id}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-center border border-dashed border-muted-foreground/25 rounded-lg">
            <div className="space-y-2">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Nenhum módulo disponível neste curso
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Course Banner */}
        <CourseBannerSection />
        
        {/* Search Section */}
        <div className="px-8 py-6 border-b border-border/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Courses Showcase */}
        <div className="px-8 py-8 space-y-12">
          {isLoading ? (
            <div className="space-y-12">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-6">
                  <Skeleton className="h-12 w-80" />
                  <div className="flex gap-6 overflow-x-auto pb-4">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="flex-none w-80 h-48 rounded-xl border bg-card p-6">
                        <Skeleton className="h-6 w-3/4 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3 mb-6" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <CourseSection key={course.id} course={course} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {searchTerm ? 'Nenhum curso encontrado' : 'Nenhum curso disponível'}
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca para encontrar o curso desejado'
                  : 'Não há cursos disponíveis no momento. Volte em breve para ver novos conteúdos.'
                }
              </p>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Limpar busca
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};