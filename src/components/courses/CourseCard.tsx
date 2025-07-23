import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description?: string;
    thumbnail_url?: string;
  };
  moduleCount?: number;
  lessonCount?: number;
  progress?: number;
}

export const CourseCard = ({ course, moduleCount = 0, lessonCount = 0, progress = 0 }: CourseCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="h-full transition-all hover:shadow-lg">
      <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
        {course.thumbnail_url ? (
          <img 
            src={course.thumbnail_url} 
            alt={course.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="line-clamp-2">{course.title}</CardTitle>
          {progress > 0 && (
            <Badge variant="secondary">{Math.round(progress)}%</Badge>
          )}
        </div>
        {course.description && (
          <CardDescription className="line-clamp-3">
            {course.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{moduleCount} módulos</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{lessonCount} aulas</span>
          </div>
        </div>

        {progress > 0 && (
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
          onClick={() => navigate(`/courses/${course.id}`)}
        >
          {progress > 0 ? 'Continuar Curso' : 'Iniciar Curso'}
        </Button>
      </CardContent>
    </Card>
  );
};