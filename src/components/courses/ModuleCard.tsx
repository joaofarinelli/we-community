import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModuleNextLesson } from '@/hooks/useModuleNextLesson';

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
}

export const ModuleCard = ({ 
  module, 
  lessonCount = 0, 
  completedLessons = 0,
  isCompleted = false 
}: ModuleCardProps) => {
  const navigate = useNavigate();
  const { data: nextLesson, isLoading } = useModuleNextLesson(module.id, module.course_id);

  const handleClick = () => {
    if (isLoading) return;
    
    if (nextLesson) {
      navigate(`/courses/${module.course_id}/modules/${module.id}/lessons/${nextLesson.id}`);
    } else {
      // Fallback to module page if no lessons found
      navigate(`/courses/${module.course_id}/modules/${module.id}`);
    }
  };

  return (
    <div 
      className="flex-none w-60 h-96 group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
      onClick={handleClick}
    >
      {module.thumbnail_url ? (
        <img 
          src={module.thumbnail_url} 
          alt={module.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/30 flex items-center justify-center mx-auto">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <div className="h-4 bg-primary/20 rounded w-32 mx-auto"></div>
              <div className="h-3 bg-primary/10 rounded w-24 mx-auto"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};