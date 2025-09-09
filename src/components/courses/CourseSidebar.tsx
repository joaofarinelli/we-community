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
    <div className="space-y-4">
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

  return (
    <div className="space-y-2">
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            disabled={isLocked}
            className="w-full justify-between p-4 h-auto text-left hover:bg-muted/20 disabled:opacity-60 disabled:cursor-not-allowed bg-background/50"
          >
            <div className="flex items-center gap-3">
              <Play className="h-5 w-5 text-foreground" />
              <span className="font-medium text-foreground">{module.title}</span>
              {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
            </div>
            {isOpen ? (
              <ChevronDown className="h-5 w-5 text-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {lessonsLoading ? (
            <div className="space-y-3 px-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : lessons && lessons.length > 0 ? (
            <div className="space-y-2 px-2">
              {lessons.map((lesson) => {
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
                      "relative flex gap-4 p-4 rounded-lg transition-all cursor-pointer border-l-4",
                      hasAccess ? "hover:bg-muted/30" : "opacity-60 cursor-not-allowed",
                      isCurrent ? "border-l-orange-500 bg-orange-500/10" : "border-l-transparent",
                      isCompleted && !isCurrent && "bg-muted/20"
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      {thumbnailUrl ? (
                        <div className="w-[100px] h-[70px] rounded overflow-hidden bg-muted">
                          <img 
                            src={thumbnailUrl} 
                            alt={lesson.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-[100px] h-[70px] rounded bg-muted flex items-center justify-center">
                          <Play className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground mb-2 text-sm">{lesson.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {lesson.description || `Seja muito bem recepcionado com o Fundador do CAE Club, ${module.title} que está há mais de 10 anos investindo em pessoas e gerando oportunidades valiosas através do Networking`}
                      </p>
                    </div>
                    
                    {/* Status Button */}
                    <div className="flex-shrink-0 flex items-center">
                      {isCompleted ? (
                        <Button 
                          size="sm" 
                          className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Concluída
                        </Button>
                      ) : isCurrent ? (
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      ) : null}
                      
                      {!hasAccess && (
                        <Lock className="h-4 w-4 text-muted-foreground ml-2" />
                      )}
                    </div>
                  </div>
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
    </div>
  );
};