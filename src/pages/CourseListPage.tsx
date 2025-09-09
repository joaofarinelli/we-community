import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CourseCard } from '@/components/courses/CourseCard';
import { PageBanner } from '@/components/ui/page-banner';
import { useCourses } from '@/hooks/useCourses';
import { useUserCourseProgress } from '@/hooks/useUserCourseProgress';
import { useCourseAccess } from '@/hooks/useCourseAccess';
import { useCourseModules } from '@/hooks/useCourseModules';
import { useCourseLessons } from '@/hooks/useCourseLessons';
import { Skeleton } from '@/components/ui/skeleton';

const CourseCardWithData = ({ course }: { course: any }) => {
  const { data: modules } = useCourseModules(course.id);
  const { data: allLessons } = useCourseLessons(modules?.[0]?.id || '');
  const { data: userProgress } = useUserCourseProgress(course.id);
  
  const moduleCount = modules?.length || 0;
  const totalLessons = modules?.reduce((acc, module) => {
    // This is a simplified count - in real implementation you'd need to count lessons for each module
    return acc + (allLessons?.length || 0);
  }, 0) || 0;
  
  const completedLessons = userProgress?.filter(p => p.completed_at).length || 0;
  const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  
  return (
    <CourseCard
      course={course}
      moduleCount={moduleCount}
      lessonCount={totalLessons}
      progress={progress}
    />
  );
};

const CourseCardWithAccess = ({ course }: { course: any }) => {
  const { data: courseAccess } = useCourseAccess();
  const { data: modules } = useCourseModules(course.id);
  const { data: userProgress } = useUserCourseProgress(course.id);
  
  const isLocked = courseAccess && !courseAccess[course.id];
  const moduleCount = modules?.length || 0;
  const completedLessons = userProgress?.filter(p => p.completed_at).length || 0;
  const totalLessons = modules?.reduce((acc) => acc + 1, 0) || 0; // Simplified
  const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  
  return (
    <CourseCard
      course={course}
      moduleCount={moduleCount}
      lessonCount={totalLessons}
      progress={progress}
      isLocked={isLocked}
      lockReason={isLocked ? "Complete o curso anterior" : ""}
    />
  );
};

export const CourseListPage = () => {
  const { data: courses, isLoading } = useCourses();

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

  if (!courses || courses.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageBanner bannerType="courses" />
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-muted-foreground">
              Nenhum curso disponível
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Os cursos aparecerão aqui quando estiverem disponíveis.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageBanner bannerType="courses" />
        
        <div>
          <h1 className="text-2xl font-bold mb-2">Cursos Disponíveis</h1>
          <p className="text-muted-foreground">
            Explore os cursos disponíveis e comece sua jornada de aprendizado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCardWithAccess key={course.id} course={course} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};