import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Clock, CheckCircle, FileText, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LessonCardProps {
  lesson: {
    id: string;
    module_id: string;
    title: string;
    description?: string;
    video_url?: string;
    duration?: number;
  };
  courseId: string;
  isCompleted?: boolean;
}

export const LessonCard = ({ lesson, courseId, isCompleted = false }: LessonCardProps) => {
  const navigate = useNavigate();
  
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  const handleStartLesson = () => {
    navigate(`/courses/${courseId}/modules/${lesson.module_id}/lessons/${lesson.id}`);
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              {lesson.video_url ? (
                <Video className="h-4 w-4 text-blue-500" />
              ) : (
                <FileText className="h-4 w-4 text-gray-500" />
              )}
              {lesson.title}
            </CardTitle>
            {lesson.description && (
              <CardDescription className="line-clamp-2">
                {lesson.description}
              </CardDescription>
            )}
          </div>
          {isCompleted && (
            <Badge variant="default" className="bg-green-100 text-green-700">
              <CheckCircle className="mr-1 h-3 w-3" />
              Concluída
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {lesson.duration && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(lesson.duration)}</span>
          </div>
        )}

        <Button 
          className="w-full"
          variant={isCompleted ? "outline" : "default"}
          onClick={handleStartLesson}
        >
          <Play className="mr-2 h-4 w-4" />
          {isCompleted ? 'Revisar Aula' : 'Iniciar Aula'}
        </Button>
      </CardContent>
    </Card>
  );
};