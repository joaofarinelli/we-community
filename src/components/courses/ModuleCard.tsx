import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PlayCircle, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const progress = lessonCount > 0 ? (completedLessons / lessonCount) * 100 : 0;

  return (
    <Card className="flex-none w-80 h-64 group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden">
      <div className="relative h-full flex flex-col">
        {/* Module Thumbnail */}
        <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          {module.thumbnail_url ? (
            <img 
              src={module.thumbnail_url} 
              alt={module.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  {lessonCount} aulas
                </p>
              </div>
            </div>
          )}
          
          {/* Overlay with lesson count */}
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            {lessonCount} aulas
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-4 flex flex-col">
          {/* Header */}
          <div className="mb-3">
            <h3 className="text-lg font-bold leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors">
              {module.title}
            </h3>
            {module.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {module.description}
              </p>
            )}
          </div>
          
          {/* Progress section */}
          <div className="mt-auto space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{completedLessons}/{lessonCount} concluídas</span>
              {isCompleted && (
                <Badge variant="secondary" className="text-xs py-0.5 px-2">
                  <CheckCircle className="mr-1 h-2.5 w-2.5" />
                  Concluído
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <Progress value={progress} className="h-1.5 bg-muted/50" />
              <span className="text-xs font-medium">{Math.round(progress)}% completo</span>
            </div>
            
            <Button 
              onClick={() => navigate(`/courses/${module.course_id}/modules/${module.id}`)}
              className="w-full font-medium shadow-md hover:shadow-lg transition-all"
              variant={isCompleted ? "outline" : "default"}
              size="sm"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              {isCompleted ? "Revisar Módulo" : progress > 0 ? "Continuar" : "Iniciar Módulo"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};