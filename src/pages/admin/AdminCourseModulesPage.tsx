import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCourses } from '@/hooks/useCourses';
import { useCourseModules } from '@/hooks/useCourseModules';
import { useDeleteModule } from '@/hooks/useManageCourses';
import { CreateModuleDialog } from '@/components/admin/CreateModuleDialog';
import { EditModuleDialog } from '@/components/admin/EditModuleDialog';
import { Search, Plus, Edit, Trash2, ArrowLeft, BookOpen, Eye } from 'lucide-react';
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

export const AdminCourseModulesPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  
  const { data: courses } = useCourses();
  const { data: modules, isLoading } = useCourseModules(courseId!);
  const deleteModule = useDeleteModule();

  const course = courses?.find(c => c.id === courseId);
  
  const filteredModules = modules?.filter(module =>
    module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDeleteModule = async (moduleId: string) => {
    if (!courseId) return;
    try {
      await deleteModule.mutateAsync({ id: moduleId, course_id: courseId });
    } catch (error) {
      console.error('Error deleting module:', error);
    }
  };

  if (!course) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Curso não encontrado</h2>
          <Button onClick={() => navigate('/admin/courses')}>
            Voltar aos Cursos
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/courses')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos Cursos
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Módulos do Curso</h1>
            <p className="text-muted-foreground">
              Gerencie os módulos de "{course.title}"
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Módulo
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar módulos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Modules List */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredModules.map((module) => (
            <Card key={module.id}>
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-2">{module.title}</CardTitle>
                {module.description && (
                  <CardDescription className="line-clamp-3">
                    {module.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/courses/${courseId}/modules/${module.id}`)}
                    className="flex-1"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Módulo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingModule(module)}
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
                        <AlertDialogTitle>Excluir Módulo</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o módulo "{module.title}"? 
                          Esta ação não pode ser desfeita e todas as aulas serão removidas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteModule(module.id)}
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
                  onClick={() => navigate(`/admin/courses/${courseId}/modules/${module.id}/lessons`)}
                  className="w-full"
                >
                  Gerenciar Aulas
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredModules.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'Nenhum módulo encontrado' : 'Nenhum módulo criado'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Tente ajustar os termos de busca'
                : 'Comece criando o primeiro módulo deste curso'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Módulo
              </Button>
            )}
          </div>
        )}

        {/* Dialogs */}
        <CreateModuleDialog 
          courseId={courseId!}
          open={createDialogOpen} 
          onOpenChange={setCreateDialogOpen} 
        />
        
        {editingModule && (
          <EditModuleDialog 
            module={editingModule}
            open={!!editingModule} 
            onOpenChange={(open) => !open && setEditingModule(null)} 
          />
        )}
      </div>
    </AdminLayout>
  );
};