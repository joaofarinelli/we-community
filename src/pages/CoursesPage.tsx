import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ModuleCard } from '@/components/courses/ModuleCard';
import { PageBanner } from '@/components/ui/page-banner';
import { CourseBannerSection } from '@/components/courses/CourseBannerSection';
import { Button } from '@/components/ui/button';
import { useCourses } from '@/hooks/useCourses';
import { useCourseModules } from '@/hooks/useCourseModules';
import { useCourseLessons } from '@/hooks/useCourseLessons';
import { useUserCourseProgress } from '@/hooks/useUserCourseProgress';
import { useModuleAccess } from '@/hooks/useCourseAccess';
import { useReorderCourses } from '@/hooks/useReorderCourses';
import { useReorderModules } from '@/hooks/useReorderModules';
import { useIsAdmin } from '@/hooks/useUserRole';
import { BookOpen, Clock, ArrowUpDown, GripVertical } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ModuleCardWithData = ({ module, courseId, userProgress }: { 
  module: any; 
  courseId: string; 
  userProgress: any[] 
}) => {
  const { data: lessons } = useCourseLessons(module.id);
  const { data: moduleAccess, isLoading: accessLoading } = useModuleAccess(courseId);
  const lessonCount = lessons?.length || 0;
  
  const completedLessons = userProgress?.filter(p => 
    p.module_id === module.id
  ).length || 0;
  
  const isCompleted = lessonCount > 0 && completedLessons === lessonCount;
  const isLocked = !accessLoading && moduleAccess && moduleAccess[module.id] === false;

  return (
    <ModuleCard
      module={module}
      lessonCount={lessonCount}
      completedLessons={completedLessons}
      isCompleted={isCompleted}
      isLocked={isLocked}
      isClickDisabled={accessLoading}
    />
  );
};

const SortableModuleCard = ({ module, courseId, userProgress, isReordering }: { 
  module: any; 
  courseId: string; 
  userProgress: any[];
  isReordering: boolean;
}) => {
  const { data: lessons } = useCourseLessons(module.id);
  const { data: moduleAccess, isLoading: accessLoading } = useModuleAccess(courseId);
  const lessonCount = lessons?.length || 0;
  
  const completedLessons = userProgress?.filter(p => 
    p.module_id === module.id
  ).length || 0;
  
  const isCompleted = lessonCount > 0 && completedLessons === lessonCount;
  const isLocked = !accessLoading && moduleAccess && moduleAccess[module.id] === false;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {isReordering && (
        <div 
          {...attributes} 
          {...listeners}
          className="absolute top-2 right-2 z-10 p-1 rounded bg-background/80 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <ModuleCard
        module={module}
        lessonCount={lessonCount}
        completedLessons={completedLessons}
        isCompleted={isCompleted}
        isClickDisabled={isReordering || accessLoading}
        isLocked={isLocked}
      />
    </div>
  );
};

const CourseSection = ({ course, userProgress }: { course: any; userProgress: any[] }) => {
  const { data: modules } = useCourseModules(course.id);
  const isAdmin = useIsAdmin();
  const reorderModules = useReorderModules();
  const [isReorderingModules, setIsReorderingModules] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id && modules) {
      const oldIndex = modules.findIndex((module: any) => module.id === active.id);
      const newIndex = modules.findIndex((module: any) => module.id === over.id);
      
      const reorderedModules = arrayMove(modules, oldIndex, newIndex);
      
      const moduleUpdates = reorderedModules.map((module: any, index: number) => ({
        id: module.id,
        order_index: index,
      }));

      reorderModules.mutate({
        courseId: course.id,
        moduleUpdates,
      });
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
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
          
          {isAdmin && modules && modules.length > 1 && (
            <Button
              variant={isReorderingModules ? "default" : "outline"}
              size="sm"
              onClick={() => setIsReorderingModules(!isReorderingModules)}
              className="flex items-center gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              {isReorderingModules ? "Concluir" : "Reordenar"}
            </Button>
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={modules.map((m: any) => m.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
              {modules.map((module: any) => (
                <SortableModuleCard 
                  key={module.id} 
                  module={module} 
                  courseId={course.id}
                  userProgress={userProgress}
                  isReordering={isReorderingModules}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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

const SortableCourseSection = ({ course, userProgress, isReordering }: { 
  course: any; 
  userProgress: any[];
  isReordering: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: course.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {isReordering && (
        <div 
          {...attributes} 
          {...listeners}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-background/80 border cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <CourseSection course={course} userProgress={userProgress} />
    </div>
  );
};

export const CoursesPage = () => {
  const { data: courses, isLoading } = useCourses();
  const { data: userProgress } = useUserCourseProgress();
  const isAdmin = useIsAdmin();
  const reorderCourses = useReorderCourses();
  const [isReorderingCourses, setIsReorderingCourses] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id && courses) {
      const oldIndex = courses.findIndex((course: any) => course.id === active.id);
      const newIndex = courses.findIndex((course: any) => course.id === over.id);
      
      const reorderedCourses = arrayMove(courses, oldIndex, newIndex);
      
      const courseUpdates = reorderedCourses.map((course: any, index: number) => ({
        id: course.id,
        order_index: index,
      }));

      reorderCourses.mutate({
        courseUpdates,
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Course Banner - Full Width */}
        <div className="-mx-8 -mt-8 mb-8">
          <CourseBannerSection />
        </div>

        {/* Courses Showcase */}
        <div className="px-8 py-8 space-y-12">
          {/* Reorder Controls */}
          {isAdmin && courses && courses.length > 1 && (
            <div className="flex justify-end">
              <Button
                variant={isReorderingCourses ? "default" : "outline"}
                onClick={() => setIsReorderingCourses(!isReorderingCourses)}
                className="flex items-center gap-2"
              >
                <ArrowUpDown className="h-4 w-4" />
                {isReorderingCourses ? "Concluir Reordenação" : "Reordenar Cursos"}
              </Button>
            </div>
          )}

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
          ) : courses && courses.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={courses.map((c: any) => c.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-12">
                  {courses.map((course: any) => (
                    <SortableCourseSection 
                      key={course.id} 
                      course={course} 
                      userProgress={userProgress || []}
                      isReordering={isReorderingCourses}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhum curso disponível</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Não há cursos disponíveis no momento. Volte em breve para ver novos conteúdos.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};