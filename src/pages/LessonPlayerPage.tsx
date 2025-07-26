import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCourses } from '@/hooks/useCourses';
import { useCourseModules } from '@/hooks/useCourseModules';
import { useCourseLessons } from '@/hooks/useCourseLessons';
import { useUserCourseProgress, useMarkLessonComplete } from '@/hooks/useUserCourseProgress';
import { ArrowLeft, CheckCircle, Play, FileText, Video, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { DifficultyBadge } from '@/components/courses/DifficultyBadge';
import { LessonComments } from '@/components/courses/LessonComments';
import { LessonLikeButton } from '@/components/courses/LessonLikeButton';
import { LessonFavoriteButton } from '@/components/courses/LessonFavoriteButton';
import { LessonCompletionReward } from '@/components/courses/LessonCompletionReward';

export const LessonPlayerPage = () => {
  const { courseId, moduleId, lessonId } = useParams<{ 
    courseId: string; 
    moduleId: string; 
    lessonId: string; 
  }>();
  const navigate = useNavigate();
  const [isCompleting, setIsCompleting] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [completionRewards, setCompletionRewards] = useState<any>(null);
  
  const { data: courses } = useCourses();
  const { data: modules } = useCourseModules(courseId!);
  const { data: lessons } = useCourseLessons(moduleId!);
  const { data: userProgress } = useUserCourseProgress(courseId);
  const markLessonComplete = useMarkLessonComplete();
  
  const course = courses?.find(c => c.id === courseId);
  const module = modules?.find(m => m.id === moduleId);
  const lesson = lessons?.find(l => l.id === lessonId);
  
  const isCompleted = userProgress?.some(p => p.lesson_id === lessonId);
  const currentLessonIndex = lessons?.findIndex(l => l.id === lessonId) ?? -1;
  const nextLesson = lessons?.[currentLessonIndex + 1];
  const prevLesson = lessons?.[currentLessonIndex - 1];

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  const handleCompleteLesson = async () => {
    if (!lesson || !courseId || !moduleId || isCompleted) return;
    
    setIsCompleting(true);
    try {
      const result = await markLessonComplete.mutateAsync({
        lessonId: lesson.id,
        moduleId,
        courseId
      });

      if (result.alreadyCompleted) {
        toast.info('Você já completou esta lição!');
        return;
      }

      if (result.rewards) {
        setCompletionRewards(result.rewards);
        setShowRewardModal(true);
      }

      toast.success('Aula marcada como concluída!');
    } catch (error) {
      toast.error('Erro ao marcar aula como concluída');
      console.error('Error completing lesson:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleNextLesson = () => {
    if (nextLesson) {
      navigate(`/courses/${courseId}/modules/${moduleId}/lessons/${nextLesson.id}`);
    }
  };

  const handlePrevLesson = () => {
    if (prevLesson) {
      navigate(`/courses/${courseId}/modules/${moduleId}/lessons/${prevLesson.id}`);
    }
  };

  if (!course || !module || !lesson) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Aula não encontrada</h2>
          <p className="text-muted-foreground mb-4">
            A aula que você está procurando não existe ou foi removida.
          </p>
          <Button onClick={() => navigate(`/courses/${courseId}/modules/${moduleId}`)}>
            Voltar ao Módulo
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">

        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/courses/${courseId}/modules/${moduleId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar ao Módulo</span>
            <span className="sm:hidden">Voltar</span>
          </Button>
        </div>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Video/Content Area */}
            <Card>
              <CardContent className="p-0">
                {lesson.video_url ? (
                  <div className="aspect-video">
                    <iframe
                      src={lesson.video_url}
                      title={lesson.title}
                      className="h-full w-full rounded-t-lg"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center bg-muted rounded-t-lg">
                    <div className="text-center">
                      <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">Aula em Texto</p>
                      <p className="text-muted-foreground">
                        Esta aula contém material de leitura
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lesson Content */}
            {lesson.content && (
              <Card>
                <CardHeader>
                  <CardTitle>Conteúdo da Aula</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{lesson.content}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={handlePrevLesson}
                disabled={!prevLesson}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Aula Anterior</span>
                  <span className="sm:hidden">Anterior</span>
              </Button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {!isCompleted && (
                  <Button
                    onClick={handleCompleteLesson}
                    disabled={isCompleting}
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{isCompleting ? 'Marcando...' : 'Marcar como Concluída'}</span>
                    <span className="sm:hidden">{isCompleting ? 'Marcando...' : 'Concluir'}</span>
                  </Button>
                )}

                <Button
                  onClick={handleNextLesson}
                  disabled={!nextLesson}
                  className="w-full sm:w-auto"
                >
                  <span className="hidden sm:inline">Próxima Aula</span>
                  <span className="sm:hidden">Próxima</span>
                  <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Lesson Info */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {lesson.video_url ? (
                        <Video className="h-5 w-5 text-blue-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-gray-500" />
                      )}
                      <span className="truncate">{lesson.title}</span>
                    </CardTitle>
                    {lesson.description && (
                      <CardDescription className="text-sm">
                        {lesson.description}
                      </CardDescription>
                    )}
                  </div>
                  {isCompleted && (
                    <Badge variant="default" className="bg-green-100 text-green-700 flex-shrink-0">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Concluída
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {lesson.duration && lesson.duration > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(lesson.duration)}</span>
                      </div>
                    )}
                    <DifficultyBadge difficulty={(lesson as any).difficulty_level || 'beginner'} />
                  </div>
                  <div className="flex items-center gap-2">
                    <LessonFavoriteButton lessonId={lessonId!} />
                    <LessonLikeButton lessonId={lessonId!} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Module Progress */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Progresso do Módulo</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {lessons?.map((l, index) => {
                    const isLessonCompleted = userProgress?.some(p => p.lesson_id === l.id);
                    const isCurrent = l.id === lessonId;
                    
                    return (
                      <div
                        key={l.id}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                          isCurrent 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                          isLessonCompleted 
                            ? 'bg-green-100 border-green-500 text-green-700' 
                            : isCurrent
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground'
                        }`}>
                          {isLessonCompleted ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => navigate(`/courses/${courseId}/modules/${moduleId}/lessons/${l.id}`)}
                            className="text-left w-full"
                          >
                            <p className={`text-xs font-medium truncate ${
                              isCurrent ? 'text-primary' : ''
                            }`}>
                              {l.title}
                            </p>
                            {l.duration && l.duration > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {formatDuration(l.duration)}
                              </p>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              </Card>
            </div>

            {/* Comments Section */}
            <div className="mt-8">
              <LessonComments lessonId={lessonId!} />
            </div>
          </div>
        </div>

        {/* Completion Reward Modal */}
        {completionRewards && (
          <LessonCompletionReward
            isVisible={showRewardModal}
            onClose={() => setShowRewardModal(false)}
            rewards={completionRewards}
          />
        )}
      </DashboardLayout>
  );
};