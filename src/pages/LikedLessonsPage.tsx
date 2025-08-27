import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Clock, BookOpen, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface LikedLesson {
  id: string;
  lesson_id: string;
  created_at: string;
  lesson: {
    id: string;
    title: string;
    description: string;
    duration: number;
    difficulty_level: string;
    module_id: string;
    module: {
      title: string;
      course_id: string;
      course: {
        title: string;
        thumbnail_url: string;
      };
    };
  };
}

export const LikedLessonsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: likedLessons, isLoading } = useQuery({
    queryKey: ['liked-lessons', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First get the likes
      const { data: likes, error: likesError } = await supabase
        .from('lesson_likes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (likesError) {
        console.error('Error fetching lesson likes:', likesError);
        return [];
      }

      if (!likes || likes.length === 0) return [];

      // Then get lesson details for each like
      const lessonIds = likes.map(like => like.lesson_id);
      const { data: lessons, error: lessonsError } = await supabase
        .from('course_lessons')
        .select(`
          id,
          title,
          description,
          duration,
          difficulty_level,
          module_id,
          course_modules!inner(
            title,
            course_id,
            courses!inner(
              title,
              thumbnail_url
            )
          )
        `)
        .in('id', lessonIds);

      if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError);
        return [];
      }

      // Combine likes with lesson data
      const combinedData = likes.map(like => {
        const lesson = lessons?.find(l => l.id === like.lesson_id);
        return {
          ...like,
          lesson: lesson ? {
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            duration: lesson.duration,
            difficulty_level: lesson.difficulty_level,
            module_id: lesson.module_id,
            module: {
              title: lesson.course_modules.title,
              course_id: lesson.course_modules.course_id,
              course: {
                title: lesson.course_modules.courses.title,
                thumbnail_url: lesson.course_modules.courses.thumbnail_url
              }
            }
          } : null
        };
      }).filter(like => like.lesson) as LikedLesson[];

      return combinedData;
    },
    enabled: !!user?.id,
  });

  const handleLessonClick = (lesson: LikedLesson) => {
    navigate(`/courses/${lesson.lesson.module.course_id}/modules/${lesson.lesson.module_id}/lessons/${lesson.lesson_id}`);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'Iniciante';
      case 'intermediate':
        return 'Intermediário';
      case 'advanced':
        return 'Avançado';
      default:
        return level;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Heart className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Aulas Curtidas</h1>
            <p className="text-muted-foreground">Todas as aulas que você curtiu</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-12" />
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : likedLessons && likedLessons.length > 0 ? (
          <div className="grid gap-4">
            {likedLessons.map((likedLesson) => (
              <Card key={likedLesson.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      {likedLesson.lesson.module.course.thumbnail_url ? (
                        <img
                          src={likedLesson.lesson.module.course.thumbnail_url}
                          alt={likedLesson.lesson.module.course.title}
                          className="h-full w-full object-cover rounded-lg"
                        />
                      ) : (
                        <BookOpen className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {likedLesson.lesson.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {likedLesson.lesson.module.course.title} • {likedLesson.lesson.module.title}
                      </p>
                      {likedLesson.lesson.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {likedLesson.lesson.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 mt-2">
                        <Badge className={getDifficultyColor(likedLesson.lesson.difficulty_level)}>
                          {getDifficultyLabel(likedLesson.lesson.difficulty_level)}
                        </Badge>
                        
                        {likedLesson.lesson.duration > 0 && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {formatDuration(likedLesson.lesson.duration)}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                          <span>Curtiu em {new Date(likedLesson.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLessonClick(likedLesson)}
                      className="flex-shrink-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="p-4 bg-muted rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Heart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhuma aula curtida ainda
              </h3>
              <p className="text-muted-foreground mb-4">
                Quando você curtir aulas, elas aparecerão aqui para fácil acesso.
              </p>
              <Button onClick={() => navigate('/dashboard/courses')}>
                Explorar Cursos
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};