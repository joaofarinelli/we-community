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
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/courses')}
            className="h-auto p-0 hover:bg-transparent"
          >
            Cursos
          </Button>
          <span>/</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/courses/${courseId}/modules`)}
            className="h-auto p-0 hover:bg-transparent"
          >
            {course.title}
          </Button>
          <span>/</span>
          <span className="text-foreground">{module.title}</span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/courses/${courseId}/modules`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos Módulos
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Aulas do Módulo</h1>
            <p className="text-muted-foreground">
              Gerencie as aulas de "{module.title}"
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Aula
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar aulas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lessons List */}
        <div className="grid gap-4">
          {filteredLessons.map((lesson, index) => (
            <Card key={lesson.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-semibold">
                        {index + 1}
                      </span>
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
                  <div className="flex items-center gap-2">
                    {lesson.duration && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="mr-1 h-3 w-3" />
                        {formatDuration(lesson.duration)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Aula
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingLesson(lesson)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
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
              </CardContent>
            </Card>
          ))}
        </div>

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