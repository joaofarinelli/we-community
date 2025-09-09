import { useCourseModules } from '@/hooks/useCourseModules';
import { useCourseLessons } from '@/hooks/useCourseLessons';
import { useUserCourseProgress } from '@/hooks/useUserCourseProgress';
import { useModuleAccess } from '@/hooks/useCourseAccess';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Play, CheckCircle2, Clock, Lock, Check } from 'lucide-react';
import { DifficultyBadge } from './DifficultyBadge';
import { cn } from '@/lib/utils';
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
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm mb-1">{module.title}</h3>
                {isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
              </div>
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
            <div className="flex items-center gap-2">
              {!lessonsLoading && completedLessons === totalLessons && totalLessons > 0 && (
                <span className="rounded-full bg-orange-600 text-white text-xs px-2.5 py-0.5">Concluída</span>
              )}
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
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
              <div className="space-y-2 p-2">
                {lessons.map((lesson, index) => {
                  const isCompleted = isLessonCompleted(lesson.id);
                  const isCurrent = lesson.id === currentLessonId;
                  const hasAccess = !isLocked;
                  const thumbnailUrl = lesson.thumbnail_url || module.thumbnail_url;

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => {
                        if (hasAccess) {
                          navigate(`/courses/${courseId}/modules/${module.id}/lessons/${lesson.id}`);
                        } else {
                          toast.error('Complete o módulo anterior para acessar este conteúdo');
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer",
                        "border border-border/50",
                        hasAccess ? "hover:bg-accent/50" : "opacity-60 cursor-not-allowed",
                        isCurrent && "border-orange-500 bg-orange-500/10",
                        isCompleted && "bg-green-500/10 border-green-500/30"
                      )}
                    >
                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        {thumbnailUrl ? (
                          <div className="relative w-12 h-8 rounded overflow-hidden">
                            <img 
                              src={thumbnailUrl} 
                              alt={lesson.title}
                              className="w-full h-full object-cover"
                            />
                            {isCompleted && (
                              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                <Check className="h-3 w-3 text-green-600" />
                              </div>
                            )}
                            {isCurrent && !isCompleted && (
                              <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                                <Play className="h-3 w-3 text-orange-600" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={cn(
                            "w-12 h-8 rounded bg-muted/50 flex items-center justify-center",
                            isCurrent && "bg-orange-500/20",
                            isCompleted && "bg-green-500/20"
                          )}>
                            {isCompleted ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Play className={cn(
                                "h-3 w-3",
                                isCurrent ? "text-orange-600" : "text-muted-foreground"
                              )} />
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium text-sm truncate",
                          isCurrent && "text-orange-600"
                        )}>
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <DifficultyBadge difficulty={lesson.difficulty_level as 'beginner' | 'intermediate' | 'advanced'} />
                          {lesson.duration && (
                            <span className="text-xs text-muted-foreground">
                              {lesson.duration}min
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              Concluída
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {!hasAccess && (
                        <div className="flex-shrink-0">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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