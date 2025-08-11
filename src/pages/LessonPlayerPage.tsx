import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCourses } from '@/hooks/useCourses';
import { useCourseModules } from '@/hooks/useCourseModules';
import { useCourseLessons } from '@/hooks/useCourseLessons';
import { useUserCourseProgress, useMarkLessonComplete } from '@/hooks/useUserCourseProgress';
import { ArrowLeft, CheckCircle, Play, FileText, Video, Clock, Maximize2, BookOpen, FileDown, MessageCircle, StickyNote, Heart, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { DifficultyBadge } from '@/components/courses/DifficultyBadge';
import { LessonComments } from '@/components/courses/LessonComments';
import { LessonMaterials } from '@/components/courses/LessonMaterials';
import { LessonNotes } from '@/components/courses/LessonNotes';
import { CourseSidebar } from '@/components/courses/CourseSidebar';
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      <div className="flex flex-col min-h-[calc(100vh-4rem)]">
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/courses')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Cursos</span>
              </Button>
              <div className="flex flex-col">
                <h1 className="font-semibold text-lg truncate max-w-96">{lesson.title}</h1>
                <p className="text-sm text-muted-foreground truncate max-w-96">
                  {course.title} • {module.title}
                </p>
              </div>
            </div>
            
            <Button variant="ghost" size="sm" className="hidden md:flex">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-4">
          {/* Left Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Video/Content Player */}
            <div className="flex-shrink-0 bg-black">
              {lesson.video_url ? (
                <div className="aspect-video relative">
                  <iframe
                    src={lesson.video_url}
                    title={lesson.title}
                    className="h-full w-full"
                    allowFullScreen
                  />
                  <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                    {lesson.title}
                  </div>
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center">
                  <div className="text-center text-white">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-70" />
                    <p className="text-lg font-medium">Aula em Texto</p>
                    <p className="text-sm opacity-70">Esta aula contém material de leitura</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex-shrink-0 border-b bg-background p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DifficultyBadge difficulty={(lesson as any).difficulty_level || 'beginner'} />
                  {lesson.duration && lesson.duration > 0 && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(lesson.duration)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <LessonFavoriteButton lessonId={lessonId!} />
                    <LessonLikeButton lessonId={lessonId!} />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!isCompleted ? (
                    <Button
                      onClick={handleCompleteLesson}
                      disabled={isCompleting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {isCompleting ? 'Marcando...' : 'Concluir'}
                    </Button>
                  ) : (
                    <Badge variant="default" className="bg-green-100 text-green-700">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Concluída
                    </Badge>
                  )}
                  
                  <Button
                    onClick={handleNextLesson}
                    disabled={!nextLesson}
                    variant="outline"
                  >
                    Próxima
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs Content */}
            <div className="flex-1">
              <Tabs defaultValue="description" className="flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-12 sticky top-0 z-10">
                  <TabsTrigger value="description" className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    Descrição
                  </TabsTrigger>
                  <TabsTrigger value="materials" className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Materiais
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Comentários
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="gap-2">
                    <StickyNote className="h-4 w-4" />
                    Anotações
                  </TabsTrigger>
                </TabsList>
                
                <div>
                  <TabsContent value="description" className="p-4 m-0">
                    <div className="space-y-4">
                      {lesson.description && (
                        <div>
                          <h3 className="font-medium mb-2">Descrição da Aula</h3>
                          <p className="text-muted-foreground">{lesson.description}</p>
                        </div>
                      )}
                      
                      {lesson.content && (
                        <div>
                          <h3 className="font-medium mb-2">Conteúdo</h3>
                          <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap text-muted-foreground">{lesson.content}</p>
                          </div>
                        </div>
                      )}
                      
                      {!lesson.description && !lesson.content && (
                        <p className="text-muted-foreground text-center py-8">
                          Nenhuma descrição disponível para esta aula.
                        </p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="materials" className="p-4 m-0">
                    <LessonMaterials lessonId={lessonId!} />
                  </TabsContent>
                  
                  <TabsContent value="comments" className="p-4 m-0">
                    <LessonComments lessonId={lessonId!} />
                  </TabsContent>
                  
                  <TabsContent value="notes" className="p-4 m-0">
                    <LessonNotes lessonId={lessonId!} />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 border-l bg-background/50 hidden lg:block sticky top-4 self-start">
            <div className="p-4">
              <div className="mb-4">
                <h3 className="font-semibold text-sm mb-2">Módulos do Curso</h3>
                <p className="text-xs text-muted-foreground mb-4">{course.title}</p>
              </div>
              
              <CourseSidebar 
                courseId={courseId!} 
                currentLessonId={lessonId}
                currentModuleId={moduleId}
              />
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
      </div>
    </DashboardLayout>
  );
};