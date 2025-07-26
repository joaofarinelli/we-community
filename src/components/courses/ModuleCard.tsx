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
    <Card className="flex-none w-80 h-48 group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden">
      <div className="relative h-full p-6 flex flex-col">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-3xl" />
        
        {/* Header */}
        <div className="relative z-10 mb-4">
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
        <div className="relative z-10 mt-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {lessonCount} aulas
            </span>
            <span>{completedLessons}/{lessonCount} concluídas</span>
          </div>
          
          <div className="space-y-2">
            <Progress value={progress} className="h-1.5 bg-muted/50" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{Math.round(progress)}% completo</span>
              {isCompleted && (
                <Badge variant="secondary" className="text-xs py-0.5 px-2">
                  <CheckCircle className="mr-1 h-2.5 w-2.5" />
                  Concluído
                </Badge>
              )}
            </div>
          </div>
          
          <Button 
            onClick={() => navigate(`/courses/${module.course_id}/modules/${module.id}`)}
            className="w-full mt-4 font-medium shadow-md hover:shadow-lg transition-all"
            variant={isCompleted ? "outline" : "default"}
            size="sm"
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            {isCompleted ? "Revisar Módulo" : progress > 0 ? "Continuar" : "Iniciar Módulo"}
          </Button>
        </div>
      </div>
    </Card>
  );
};