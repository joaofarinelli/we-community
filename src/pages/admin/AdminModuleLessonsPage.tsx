import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCourses } from '@/hooks/useCourses';
import { useCourseModules } from '@/hooks/useCourseModules';
import { useCourseLessons } from '@/hooks/useCourseLessons';
import { useDeleteLesson } from '@/hooks/useManageCourses';
import { CreateLessonDialog } from '@/components/admin/CreateLessonDialog';
import { EditLessonDialog } from '@/components/admin/EditLessonDialog';
import { Search, Plus, Edit, Trash2, ArrowLeft, Video, FileText, Clock, Eye } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const AdminModuleLessonsPage = () => {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  
  const { data: courses } = useCourses();
  const { data: modules } = useCourseModules(courseId!);
  const { data: lessons, isLoading } = useCourseLessons(moduleId!);
  const deleteLesson = useDeleteLesson();

  const course = courses?.find(c => c.id === courseId);
  const module = modules?.find(m => m.id === moduleId);
  
  const filteredLessons = lessons?.filter(lesson =>
    lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lesson.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!moduleId) return;
    try {
      await deleteLesson.mutateAsync({ id: lessonId, module_id: moduleId });
    } catch (error) {
      console.error('Error deleting lesson:', error);
    }
  };

  if (!course || !module) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Módulo não encontrado</h2>
          <Button onClick={() => navigate(`/admin/courses/${courseId}/modules`)}>
            Voltar aos Módulos
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-2 sm:p-4 lg:p-6">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/courses')}
            className="h-auto p-1 sm:p-2 hover:bg-transparent text-xs sm:text-sm"
          >
            Cursos
          </Button>
          <span className="text-muted-foreground/50">/</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/courses/${courseId}/modules`)}
            className="h-auto p-1 sm:p-2 hover:bg-transparent text-xs sm:text-sm max-w-[120px] sm:max-w-none truncate"
          >
            {course.title}
          </Button>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground font-medium max-w-[120px] sm:max-w-none truncate">{module.title}</span>
        </div>

        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/courses/${courseId}/modules`)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar aos Módulos</span>
            <span className="sm:hidden">Voltar</span>
          </Button>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Aulas do Módulo</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie as aulas de "{module.title}"
            </p>
          </div>
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="w-full sm:w-auto"
            size="default"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Nova Aula</span>
            <span className="sm:hidden">Criar</span>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar aulas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {filteredLessons.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {filteredLessons.length} aula{filteredLessons.length !== 1 ? 's' : ''} encontrada{filteredLessons.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-6 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </div>
                    <div className="h-6 w-16 bg-muted rounded" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <div className="h-8 w-20 bg-muted rounded" />
                    <div className="h-8 w-20 bg-muted rounded" />
                    <div className="h-8 w-20 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Lessons List */}
        {!isLoading && (
          <div className="space-y-4">
            {filteredLessons.map((lesson, index) => (
              <Card 
                key={lesson.id} 
                className="group relative transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border border-border/50 hover:border-border"
              >
                <CardHeader className="pb-3 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-2 flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {index + 1}
                          </span>
                          {lesson.video_url ? (
                            <Video className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                        <span className="line-clamp-2 min-w-0">{lesson.title}</span>
                      </CardTitle>
                      {lesson.description && (
                        <CardDescription className="text-xs sm:text-sm line-clamp-2 leading-relaxed">
                          {lesson.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {lesson.duration && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="mr-1 h-3 w-3" />
                          {formatDuration(lesson.duration)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="grid grid-cols-3 gap-1 sm:gap-2 flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`)}
                        className="text-xs h-8 px-2"
                        title="Ver Aula"
                      >
                        <Eye className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline">Ver</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingLesson(lesson)}
                        className="text-xs h-8 px-2"
                        title="Editar Aula"
                      >
                        <Edit className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs h-8 px-2 text-destructive hover:text-destructive"
                            title="Excluir Aula"
                          >
                            <Trash2 className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">Excluir</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="sm:max-w-[500px]">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Aula</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a aula "{lesson.title}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteLesson(lesson.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredLessons.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'Nenhuma aula encontrada' : 'Nenhuma aula criada'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Tente ajustar os termos de busca'
                : 'Comece criando a primeira aula deste módulo'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Aula
              </Button>
            )}
          </div>
        )}

        {/* Dialogs */}
        <CreateLessonDialog 
          moduleId={moduleId!}
          open={createDialogOpen} 
          onOpenChange={setCreateDialogOpen} 
        />
        
        {editingLesson && (
          <EditLessonDialog 
            lesson={editingLesson}
            open={!!editingLesson} 
            onOpenChange={(open) => !open && setEditingLesson(null)} 
          />
        )}
      </div>
    </AdminLayout>
  );
};