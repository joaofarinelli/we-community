import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { LessonCard } from '@/components/courses/LessonCard';
import { useCourses } from '@/hooks/useCourses';
import { useCourseModules } from '@/hooks/useCourseModules';
import { useCourseLessons } from '@/hooks/useCourseLessons';
import { useUserCourseProgress } from '@/hooks/useUserCourseProgress';
import { useReorderLessons } from '@/hooks/useReorderLessons';
import { useIsAdmin } from '@/hooks/useUserRole';
import { ArrowLeft, BookOpen, Clock, ArrowUpDown, GripVertical } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import CertificateDialog from '@/components/courses/CertificateDialog';
import { AccessGuard } from '@/components/courses/AccessGuard';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableLessonCard = ({ lesson, courseId, isCompleted, isReordering }: {
  lesson: any;
  courseId: string;
  isCompleted: boolean;
  isReordering: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

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
      <LessonCard
        lesson={lesson}
        courseId={courseId}
        isCompleted={isCompleted}
        isClickDisabled={isReordering}
      />
    </div>
  );
};

export const ModuleDetailPage = () => {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();
  
  const { data: courses } = useCourses();
  const { data: modules } = useCourseModules(courseId!);
  const { data: lessons, isLoading: lessonsLoading } = useCourseLessons(moduleId!);
  const { data: userProgress } = useUserCourseProgress(courseId);
  const isAdmin = useIsAdmin();
  const reorderLessons = useReorderLessons();
  const [isReorderingLessons, setIsReorderingLessons] = useState(false);
  
  const course = courses?.find(c => c.id === courseId);
  const module = modules?.find(m => m.id === moduleId);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id && lessons) {
      const oldIndex = lessons.findIndex((lesson: any) => lesson.id === active.id);
      const newIndex = lessons.findIndex((lesson: any) => lesson.id === over.id);
      
      const reorderedLessons = arrayMove(lessons, oldIndex, newIndex);
      
      const lessonUpdates = reorderedLessons.map((lesson: any, index: number) => ({
        id: lesson.id,
        order_index: index,
      }));

      reorderLessons.mutate({
        moduleId: moduleId!,
        lessonUpdates,
      });
    }
  };
  
  const completedLessonIds = new Set(
    userProgress?.filter(p => p.module_id === moduleId).map(p => p.lesson_id) || []
  );

  if (!course || !module) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Módulo não encontrado</h2>
          <p className="text-muted-foreground mb-4">
            O módulo que você está procurando não existe ou foi removido.
          </p>
          <Button onClick={() => navigate(`/courses`)}>
            Voltar ao Curso
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Local state for dialog
  const [certOpen, setCertOpen] = useState(false);

  return (
    <AccessGuard courseId={courseId!} moduleId={moduleId!}>
      <DashboardLayout>
        <div className="p-8 space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/courses`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Curso
          </Button>

          {/* Mostrar ação de certificado quando habilitado no curso */}
          {(course as any)?.certificate_enabled && (
            <Button variant="outline" size="sm" onClick={() => setCertOpen(true)}>
              Certificado
            </Button>
          )}
        </div>

        {/* Module Info */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{module.title}</h1>
            {module.description && (
              <p className="mt-2 text-lg text-muted-foreground">
                {module.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{lessons?.length || 0} aulas</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{completedLessonIds.size}/{lessons?.length || 0} concluídas</span>
            </div>
          </div>

          {/* Progress Bar */}
          {lessons && lessons.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso do Módulo</span>
                <span>{Math.round((completedLessonIds.size / lessons.length) * 100)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div 
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${(completedLessonIds.size / lessons.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Lessons Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Aulas do Módulo</h2>
            
            {isAdmin && lessons && lessons.length > 1 && (
              <Button
                variant={isReorderingLessons ? "default" : "outline"}
                size="sm"
                onClick={() => setIsReorderingLessons(!isReorderingLessons)}
                className="flex items-center gap-2"
              >
                <ArrowUpDown className="h-4 w-4" />
                {isReorderingLessons ? "Concluir" : "Reordenar"}
              </Button>
            )}
          </div>
          
          {lessonsLoading ? (
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
          ) : lessons && lessons.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={lessons.map((l: any) => l.id)} strategy={rectSortingStrategy}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {lessons.map((lesson: any) => (
                    <SortableLessonCard
                      key={lesson.id}
                      lesson={lesson}
                      courseId={courseId!}
                      isCompleted={completedLessonIds.has(lesson.id)}
                      isReordering={isReorderingLessons}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma aula encontrada</h3>
              <p className="text-muted-foreground">
                Este módulo ainda não possui aulas criadas.
              </p>
            </div>
          )}
        </div>

        {/* Certificate Dialog */}
        {(course as any)?.certificate_enabled && courseId && (
          <CertificateDialog
            open={certOpen}
            onOpenChange={setCertOpen}
            courseId={courseId}
          />
        )}
      </div>
    </DashboardLayout>
    </AccessGuard>
  );
};
