import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Users, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description?: string;
  };
  moduleCount?: number;
  lessonCount?: number;
  progress?: number;
  isLocked?: boolean;
  lockReason?: string;
}

export const CourseCard = ({ 
  course, 
  moduleCount = 0, 
  lessonCount = 0, 
  progress = 0,
  isLocked = false,
  lockReason = ''
}: CourseCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className={`h-full transition-all hover:shadow-lg ${isLocked ? 'opacity-60' : ''}`}>
      <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted relative">
        <div className="flex h-full items-center justify-center">
          {isLocked ? (
            <div className="flex flex-col items-center gap-2">
              <Lock className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Bloqueado</span>
            </div>
          ) : (
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="line-clamp-2 text-lg">{course.title}</CardTitle>
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
          disabled={isLocked}
        >
          {isLocked ? (
            <>
              <Lock className="mr-2 h-4 w-4" />
              {lockReason || 'Curso Bloqueado'}
            </>
          ) : (
            progress > 0 ? 'Continuar Curso' : 'Iniciar Curso'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};