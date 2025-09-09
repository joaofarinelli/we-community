import { Clock, BookOpen, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModuleNextLesson } from '@/hooks/useModuleNextLesson';
import { toast } from 'sonner';

interface ModuleCardProps {
  module: {
    id: string;
    course_id: string;
    title: string;
    description?: string;
    thumbnail_url?: string;
  };
  lessonCount?: number;
  completedLessons?: number;
  isCompleted?: boolean;
  isClickDisabled?: boolean;
  isLocked?: boolean;
  lockReason?: string;
}

export const ModuleCard = ({ 
  module, 
  lessonCount = 0, 
  completedLessons = 0,
  isCompleted = false,
  isClickDisabled = false,
  isLocked = false,
  lockReason = ''
}: ModuleCardProps) => {
  const navigate = useNavigate();
  const { data: nextLesson, isLoading } = useModuleNextLesson(module.id, module.course_id);

  const handleClick = () => {
    if (isLocked) {
      toast.error('Complete o módulo anterior para acessar este conteúdo');
      return;
    }
    
    if (isLoading || isClickDisabled) {
      return;
    }
    
    if (nextLesson) {
      navigate(`/courses/${module.course_id}/modules/${module.id}/lessons/${nextLesson.id}`);
    } else {
      // Fallback to module page if no lessons found
      navigate(`/courses/${module.course_id}/modules/${module.id}`);
    }
  };

  return (
    <div 
      className={`flex-none w-60 h-96 group overflow-hidden rounded-lg shadow-md transition-all duration-300 relative 
        ${isLocked ? 'opacity-60 cursor-not-allowed' : (isClickDisabled ? 'cursor-default' : 'cursor-pointer hover:shadow-xl hover:-translate-y-2')}`}
      onClick={handleClick}
    >
      {module.thumbnail_url ? (
        <div className="relative h-full w-full">
          <img 
            src={module.thumbnail_url} 
            alt={module.title}
            className={`h-full w-full object-cover transition-transform duration-500 ${isLocked ? 'grayscale' : 'group-hover:scale-105'}`}
          />
          {/* Lock overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-3">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          )}
          {/* Overlay with module info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="font-semibold text-lg mb-1 line-clamp-2">{module.title}</h3>
            {module.description && (
              <p className="text-sm text-white/80 line-clamp-2">{module.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2 text-xs text-white/60">
              <BookOpen className="h-3 w-3" />
              <span>{lessonCount} aulas</span>
              {completedLessons > 0 && (
                <>
                  <span>•</span>
                  <span>{completedLessons}/{lessonCount} concluídas</span>
                </>
              )}
              {isLocked && (
                <>
                  <span>•</span>
                  <span className="text-white/80">Bloqueado</span>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex flex-col justify-between p-4 relative">
          {/* Lock overlay for modules without thumbnail */}
          {isLocked && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="bg-background rounded-full p-3 shadow-lg">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          )}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isLocked ? 'bg-muted' : 'bg-primary/30'}`}>
                {isLocked ? (
                  <Lock className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <BookOpen className="h-8 w-8 text-primary" />
                )}
              </div>
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg text-foreground line-clamp-2">{module.title}</h3>
            {module.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{module.description}</p>
            )}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{lessonCount} aulas</span>
              {completedLessons > 0 && (
                <>
                  <span>•</span>
                  <span>{completedLessons}/{lessonCount} concluídas</span>
                </>
              )}
              {isLocked && (
                <>
                  <span>•</span>
                  <span>Bloqueado</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Progress indicator */}
      {lessonCount > 0 && (
        <div className="absolute top-2 right-2">
          <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {Math.round((completedLessons / lessonCount) * 100)}%
          </div>
        </div>
      )}
    </div>
  );
};