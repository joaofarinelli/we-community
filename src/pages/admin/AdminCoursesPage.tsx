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
import { useIsAdmin } from '@/hooks/useUserRole';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  const isAdmin = useIsAdmin();

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
      <div className="space-y-6 p-2 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gerenciar Cursos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Crie e gerencie os cursos da sua empresa
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="w-full sm:w-auto"
                  size="default"
                  disabled={!isAdmin}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Novo Curso</span>
                  <span className="sm:hidden">Criar</span>
                </Button>
              </TooltipTrigger>
              {!isAdmin && (
                <TooltipContent>
                  <p>Você precisa ser admin ou owner para criar cursos</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {filteredCourses.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {filteredCourses.length} curso{filteredCourses.length !== 1 ? 's' : ''} encontrado{filteredCourses.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video w-full bg-muted rounded-t-lg" />
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

        {/* Courses Grid */}
        {!isLoading && (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <Card 
                key={course.id} 
                className="group relative transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border border-border/50 hover:border-border"
              >
                {/* Course Thumbnail */}
                <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-muted to-muted/50">
                  {course.thumbnail_url ? (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 text-primary/60" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge 
                      variant={course.is_active ? "default" : "secondary"}
                      className="text-xs font-medium"
                    >
                      {course.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-3 space-y-2">
                  <CardTitle className="text-base sm:text-lg line-clamp-2 leading-tight">
                    {course.title}
                  </CardTitle>
                  {course.description && (
                    <CardDescription className="text-xs sm:text-sm line-clamp-2 leading-relaxed">
                      {course.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Quick Actions */}
                  <div className="grid grid-cols-3 gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/courses/${course.id}`)}
                      className="text-xs h-8 px-2"
                      title="Ver Curso"
                    >
                      <Eye className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Ver</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCourse(course)}
                      className="text-xs h-8 px-2"
                      title="Editar Curso"
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
                          title="Excluir Curso"
                        >
                          <Trash2 className="h-3 w-3 sm:mr-1" />
                          <span className="hidden sm:inline">Excluir</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="sm:max-w-[500px]">
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

                  {/* Primary Action */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/admin/courses/${course.id}/modules`)}
                    className="w-full text-xs sm:text-sm h-8 sm:h-9 font-medium bg-primary/5 hover:bg-primary/10 text-primary"
                  >
                    <BookOpen className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Gerenciar Módulos
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredCourses.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-primary/70" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">
              {searchTerm ? 'Nenhum curso encontrado' : 'Nenhum curso criado ainda'}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md">
              {searchTerm 
                ? 'Tente usar termos diferentes ou verificar a ortografia'
                : 'Crie seu primeiro curso para começar a organizar o conteúdo educacional da sua empresa'
              }
            </p>
            {!searchTerm && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => setCreateDialogOpen(true)}
                      size="lg"
                      className="shadow-lg"
                      disabled={!isAdmin}
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Criar Primeiro Curso
                    </Button>
                  </TooltipTrigger>
                  {!isAdmin && (
                    <TooltipContent>
                      <p>Você precisa ser admin ou owner para criar cursos</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
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