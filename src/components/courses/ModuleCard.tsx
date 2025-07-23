import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{module.title}</CardTitle>
            {module.description && (
              <CardDescription className="line-clamp-2">
                {module.description}
              </CardDescription>
            )}
          </div>
          {isCompleted && (
            <Badge variant="default" className="bg-green-100 text-green-700">
              <CheckCircle className="mr-1 h-3 w-3" />
              Concluído
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{lessonCount} aulas</span>
          </div>
          <span>{completedLessons}/{lessonCount} concluídas</span>
        </div>

        {lessonCount > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div 
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <Button 
          className="w-full"
          variant={isCompleted ? "outline" : "default"}
          onClick={() => navigate(`/courses/${module.course_id}/modules/${module.id}`)}
        >
          <PlayCircle className="mr-2 h-4 w-4" />
          {progress > 0 ? 'Continuar Módulo' : 'Iniciar Módulo'}
        </Button>
      </CardContent>
    </Card>
  );
};