import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CourseCard } from '@/components/courses/CourseCard';
import { useCourses } from '@/hooks/useCourses';
import { useCourseModules } from '@/hooks/useCourseModules';
import { useCourseLessons } from '@/hooks/useCourseLessons';
import { useUserCourseProgress } from '@/hooks/useUserCourseProgress';
import { Search, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const CoursesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: courses, isLoading } = useCourses();
  const { data: userProgress } = useUserCourseProgress();

  const filteredCourses = courses?.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const CourseCardWithData = ({ course }: { course: any }) => {
    const { data: modules } = useCourseModules(course.id);
    const moduleCount = modules?.length || 0;
    
    // Calcular total de aulas
    const lessonCounts = modules?.map(module => {
      const { data: lessons } = useCourseLessons(module.id);
      return lessons?.length || 0;
    }) || [];
    const lessonCount = lessonCounts.reduce((total, count) => total + count, 0);

    // Calcular progresso
    const courseProgress = userProgress?.filter(p => p.course_id === course.id) || [];
    const progress = lessonCount > 0 ? (courseProgress.length / lessonCount) * 100 : 0;

    return (
      <CourseCard
        course={course}
        moduleCount={moduleCount}
        lessonCount={lessonCount}
        progress={progress}
      />
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cursos</h1>
            <p className="text-muted-foreground">
              Explore e participe dos cursos disponíveis em sua empresa
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <CourseCardWithData key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'Nenhum curso encontrado' : 'Nenhum curso disponível'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Tente ajustar os termos de busca'
                : 'Não há cursos disponíveis no momento'
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
    </DashboardLayout>
  );
};