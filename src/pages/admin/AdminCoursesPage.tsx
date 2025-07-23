import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCourses } from '@/hooks/useCourses';
import { useDeleteCourse } from '@/hooks/useManageCourses';
import { CreateCourseDialog } from '@/components/admin/CreateCourseDialog';
import { EditCourseDialog } from '@/components/admin/EditCourseDialog';
import { Search, Plus, Edit, Trash2, BookOpen, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

export const AdminCoursesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  
  const navigate = useNavigate();
  const { data: courses, isLoading } = useCourses();
  const deleteCourse = useDeleteCourse();

  const filteredCourses = courses?.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await deleteCourse.mutateAsync(courseId);
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Cursos</h1>
            <p className="text-muted-foreground">
              Crie e gerencie os cursos da sua empresa
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Curso
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Courses List */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="relative">
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
                  <Badge variant={course.is_active ? "default" : "secondary"}>
                    {course.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                {course.description && (
                  <CardDescription className="line-clamp-3">
                    {course.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/courses/${course.id}`)}
                    className="flex-1"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Curso
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCourse(course)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Curso</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o curso "{course.title}"? 
                          Esta ação não pode ser desfeita e todos os módulos e aulas serão removidos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteCourse(course.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/admin/courses/${course.id}/modules`)}
                  className="w-full"
                >
                  Gerenciar Módulos
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCourses.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'Nenhum curso encontrado' : 'Nenhum curso criado'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Tente ajustar os termos de busca'
                : 'Comece criando seu primeiro curso'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Curso
              </Button>
            )}
          </div>
        )}

        {/* Dialogs */}
        <CreateCourseDialog 
          open={createDialogOpen} 
          onOpenChange={setCreateDialogOpen} 
        />
        
        {editingCourse && (
          <EditCourseDialog 
            course={editingCourse}
            open={!!editingCourse} 
            onOpenChange={(open) => !open && setEditingCourse(null)} 
          />
        )}
      </div>
    </AdminLayout>
  );
};