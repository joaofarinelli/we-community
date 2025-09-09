import { useCourseModules } from '@/hooks/useCourseModules';
import { useCourseLessons } from '@/hooks/useCourseLessons';
import { useUserCourseProgress } from '@/hooks/useUserCourseProgress';
import { useModuleAccess } from '@/hooks/useCourseAccess';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Play, CheckCircle2, Clock, Lock } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CourseSidebarProps {
  courseId: string;
  currentLessonId?: string;
  currentModuleId?: string;
}

export const CourseSidebar = ({ courseId, currentLessonId, currentModuleId }: CourseSidebarProps) => {
  const navigate = useNavigate();
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({
    [currentModuleId || '']: true
  });

  const { data: modules, isLoading: modulesLoading } = useCourseModules(courseId);
  const { data: moduleAccess, isLoading: accessLoading } = useModuleAccess(courseId);
  const { data: progress } = useUserCourseProgress(courseId);

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress?.some(p => p.lesson_id === lessonId && p.completed_at);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (modulesLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!modules || modules.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum módulo encontrado para este curso.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {modules.map((module) => (
        <ModuleSection
          key={module.id}
          module={module}
          courseId={courseId}
          isOpen={openModules[module.id] || false}
          onToggle={() => toggleModule(module.id)}
          currentLessonId={currentLessonId}
          isLessonCompleted={isLessonCompleted}
          formatDuration={formatDuration}
          isLocked={!accessLoading && moduleAccess && moduleAccess[module.id] === false}
          navigate={navigate}
        />
      ))}
    </div>
  );
};

interface ModuleSectionProps {
  module: any;
  courseId: string;
  isOpen: boolean;
  onToggle: () => void;
  currentLessonId?: string;
  isLessonCompleted: (lessonId: string) => boolean;
  formatDuration: (seconds: number) => string;
  isLocked: boolean;
  navigate: (path: string) => void;
}

const ModuleSection = ({
  module,
  courseId,
  isOpen,
  onToggle,
  currentLessonId,
  isLessonCompleted,
  formatDuration,
  isLocked,
  navigate
}: ModuleSectionProps) => {
  const { data: lessons, isLoading: lessonsLoading } = useCourseLessons(module.id);

  const completedLessons = lessons?.filter(lesson => isLessonCompleted(lesson.id)).length || 0;
  const totalLessons = lessons?.length || 0;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            disabled={isLocked}
            className="w-full justify-between p-4 h-auto text-left rounded-none hover:bg-muted/50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">{module.title}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{completedLessons}/{totalLessons} aulas</span>
                {progressPercentage > 0 && (
                  <>
                    <span>•</span>
                    <span>{Math.round(progressPercentage)}% completo</span>
                  </>
                )}
              </div>
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {lessonsLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : lessons && lessons.length > 0 ? (
            <div className="border-t">
              {lessons.map((lesson, index) => {
                const isCompleted = isLessonCompleted(lesson.id);
                const isCurrent = lesson.id === currentLessonId;

                return (
                  <Button
                    key={lesson.id}
                    variant="ghost"
                    onClick={() => {
                      if (isLocked) {
                        toast.error('Complete o módulo anterior para acessar este conteúdo');
                        return;
                      }
                      navigate(`/courses/${courseId}/modules/${module.id}/lessons/${lesson.id}`)
                    }}
                    className={`w-full justify-start p-4 h-auto text-left rounded-none border-b last:border-b-0 ${
                      isCurrent ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : isCurrent ? (
                          <Play className="h-5 w-5 text-primary" />
                        ) : (
                          <div className="h-5 w-5 border-2 border-muted-foreground rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">{index + 1}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm mb-1 truncate">{lesson.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(lesson.duration || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma aula neste módulo.
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};