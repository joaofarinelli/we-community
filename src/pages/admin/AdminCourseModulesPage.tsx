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
      <div className="space-y-6 p-2 sm:p-4 lg:p-6">
        {/* Breadcrumb and Navigation */}
        <div className="flex items-center gap-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/courses')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar aos Cursos</span>
            <span className="sm:hidden">Voltar</span>
          </Button>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Módulos do Curso</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie os módulos de "{course.title}"
            </p>
          </div>
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="w-full sm:w-auto"
            size="default"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Novo Módulo</span>
            <span className="sm:hidden">Criar</span>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar módulos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {filteredModules.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {filteredModules.length} módulo{filteredModules.length !== 1 ? 's' : ''} encontrado{filteredModules.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-full mb-1" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded mb-2" />
                  <div className="h-8 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modules Grid */}
        {!isLoading && (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredModules.map((module, index) => (
              <Card 
                key={module.id} 
                className="group relative transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border border-border/50 hover:border-border"
              >
                {/* Module Header */}
                <CardHeader className="pb-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {index + 1}
                      </div>
                      <CardTitle className="text-base sm:text-lg line-clamp-2 leading-tight flex-1">
                        {module.title}
                      </CardTitle>
                    </div>
                  </div>
                  {module.description && (
                    <CardDescription className="text-xs sm:text-sm line-clamp-2 leading-relaxed">
                      {module.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Quick Actions */}
                  <div className="grid grid-cols-3 gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/courses/${courseId}/modules/${module.id}`)}
                      className="text-xs h-8 px-2"
                      title="Ver Módulo"
                    >
                      <Eye className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Ver</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingModule(module)}
                      className="text-xs h-8 px-2"
                      title="Editar Módulo"
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
                          title="Excluir Módulo"
                        >
                          <Trash2 className="h-3 w-3 sm:mr-1" />
                          <span className="hidden sm:inline">Excluir</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="sm:max-w-[500px]">
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

                  {/* Primary Action */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/admin/courses/${courseId}/modules/${module.id}/lessons`)}
                    className="w-full text-xs sm:text-sm h-8 sm:h-9 font-medium bg-primary/5 hover:bg-primary/10 text-primary"
                  >
                    <BookOpen className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Gerenciar Aulas
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredModules.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-primary/70" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">
              {searchTerm ? 'Nenhum módulo encontrado' : 'Nenhum módulo criado ainda'}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md">
              {searchTerm 
                ? 'Tente usar termos diferentes ou verificar a ortografia'
                : 'Organize o conteúdo do curso criando módulos temáticos'
              }
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                size="lg"
                className="shadow-lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Criar Primeiro Módulo
              </Button>
            )}
            {searchTerm && (
              <Button 
                variant="outline"
                onClick={() => setSearchTerm('')}
                className="mt-2"
              >
                Limpar busca
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