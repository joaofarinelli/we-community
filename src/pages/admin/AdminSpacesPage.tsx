import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSpaceCategories } from '@/hooks/useSpaceCategories';
import { useSpaces } from '@/hooks/useSpaces';
import { AdminCreateCategoryDialog } from '@/components/admin/AdminCreateCategoryDialog';
import { AdminEditCategoryDialog } from '@/components/admin/AdminEditCategoryDialog';
import { SpaceTypeSelectionDialog } from '@/components/dashboard/SpaceTypeSelectionDialog';
import { SpaceConfigurationDialog } from '@/components/dashboard/SpaceConfigurationDialog';
import { useCreateSpace } from '@/hooks/useCreateSpace';
import { EditSpaceDialog } from '@/components/admin/EditSpaceDialog';
import { DeleteSpaceDialog } from '@/components/admin/DeleteSpaceDialog';
import { DeleteCategoryDialog } from '@/components/admin/DeleteCategoryDialog';
import { Plus, Pencil, Trash2, Users, MessageSquare, Eye } from 'lucide-react';

export const AdminSpacesPage = () => {
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedSpace, setSelectedSpace] = useState<any>(null);
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false);
  const [showDeleteSpaceDialog, setShowDeleteSpaceDialog] = useState(false);
  
  const { data: categories = [], isLoading: categoriesLoading } = useSpaceCategories();
  const { data: spaces = [], isLoading: spacesLoading } = useSpaces();
  
  // Use the advanced space creation hook
  const {
    isTypeSelectionOpen,
    isConfigurationOpen,
    selectedType,
    selectedCategoryId,
    isCreating,
    openTypeSelection,
    selectTypeAndProceed,
    closeAllDialogs,
    createSpace,
  } = useCreateSpace();

  const handleEditCategory = (category: any) => {
    setSelectedCategory(category);
  };

  const handleDeleteCategory = (category: any) => {
    setSelectedCategory(category);
    setShowDeleteCategoryDialog(true);
  };

  const handleEditSpace = (space: any) => {
    setSelectedSpace(space);
  };

  const handleDeleteSpace = (space: any) => {
    setSelectedSpace(space);
    setShowDeleteSpaceDialog(true);
  };

  const getSpaceCountByCategory = (categoryId: string) => {
    return spaces.filter(space => space.category_id === categoryId).length;
  };

  const getSpacesByCategory = (categoryId: string) => {
    return spaces.filter(space => space.category_id === categoryId);
  };

  const getVisibilityBadge = (visibility: string) => {
    const variants = {
      public: { variant: 'secondary' as const, label: 'Público' },
      private: { variant: 'outline' as const, label: 'Privado' },
      secret: { variant: 'destructive' as const, label: 'Secreto' }
    };
    
    const config = variants[visibility as keyof typeof variants] || variants.public;
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  if (categoriesLoading || spacesLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Espaços e Categorias</h1>
            <p className="text-muted-foreground">
              Configure e organize os espaços e categorias da sua empresa
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Espaços e Categorias</h1>
            <p className="text-muted-foreground">
              Configure e organize os espaços e categorias da sua empresa
            </p>
          </div>
        </div>

        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="categories">Categorias ({categories.length})</TabsTrigger>
            <TabsTrigger value="spaces">Espaços ({spaces.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => setShowCreateCategoryDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </div>

            {categories.length === 0 ? (
              <Card>
                <CardHeader className="text-center py-12">
                  <CardTitle className="text-xl text-foreground">Nenhuma categoria criada ainda</CardTitle>
                  <CardDescription className="max-w-md mx-auto">
                    Crie categorias para organizar seus espaços de forma estruturada.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pb-12">
                  <Button onClick={() => setShowCreateCategoryDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeira categoria
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {categories.map((category) => (
                  <Card key={category.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCategory(category)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        {getSpaceCountByCategory(category.id)} espaço(s)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {getSpacesByCategory(category.id).slice(0, 3).map((space) => (
                          <div key={space.id} className="flex items-center justify-between text-sm">
                            <span className="truncate">{space.name}</span>
                            {getVisibilityBadge(space.visibility)}
                          </div>
                        ))}
                        {getSpaceCountByCategory(category.id) > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{getSpaceCountByCategory(category.id) - 3} espaços adicionais
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="spaces" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => openTypeSelection(categories[0]?.id || '')}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Espaço
              </Button>
            </div>

            {spaces.length === 0 ? (
              <Card>
                <CardHeader className="text-center py-12">
                  <CardTitle className="text-xl text-foreground">Nenhum espaço criado ainda</CardTitle>
                  <CardDescription className="max-w-md mx-auto">
                    Crie espaços para permitir que os usuários interajam e compartilhem conteúdo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pb-12">
                  <Button onClick={() => openTypeSelection(categories[0]?.id || '')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeiro espaço
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {categories.map((category) => {
                  const categorySpaces = getSpacesByCategory(category.id);
                  
                  if (categorySpaces.length === 0) return null;
                  
                  return (
                    <div key={category.id} className="space-y-3">
                      <h3 className="text-lg font-semibold text-foreground">{category.name}</h3>
                      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                        {categorySpaces.map((space) => (
                          <Card key={space.id}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base truncate">{space.name}</CardTitle>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditSpace(space)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteSpace(space)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              {space.description && (
                                <CardDescription className="line-clamp-2">
                                  {space.description}
                                </CardDescription>
                              )}
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center justify-between">
                                {getVisibilityBadge(space.visibility)}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    <span>0</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MessageSquare className="h-4 w-4" />
                                    <span>0</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                {/* Espaços sem categoria */}
                {spaces.filter(space => !space.category_id).length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">Sem categoria</h3>
                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                      {spaces.filter(space => !space.category_id).map((space) => (
                        <Card key={space.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base truncate">{space.name}</CardTitle>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditSpace(space)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteSpace(space)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {space.description && (
                              <CardDescription className="line-clamp-2">
                                {space.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              {getVisibilityBadge(space.visibility)}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span>0</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-4 w-4" />
                                  <span>0</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <AdminCreateCategoryDialog
        isOpen={showCreateCategoryDialog}
        onOpenChange={setShowCreateCategoryDialog}
      />

      {selectedCategory && (
        <AdminEditCategoryDialog
          category={selectedCategory}
          isOpen={!!selectedCategory}
          onOpenChange={(open) => !open && setSelectedCategory(null)}
        />
      )}

      <SpaceTypeSelectionDialog
        open={isTypeSelectionOpen}
        onClose={closeAllDialogs}
        onSelectType={selectTypeAndProceed}
      />

      <SpaceConfigurationDialog
        open={isConfigurationOpen}
        onClose={closeAllDialogs}
        onCreateSpace={createSpace}
        selectedType={selectedType}
        selectedCategoryId={selectedCategoryId}
        isCreating={isCreating}
      />

      {selectedSpace && (
        <EditSpaceDialog
          space={selectedSpace}
          isOpen={!!selectedSpace}
          onOpenChange={(open) => !open && setSelectedSpace(null)}
        />
      )}

      {selectedCategory && showDeleteCategoryDialog && (
        <DeleteCategoryDialog
          category={selectedCategory}
          isOpen={showDeleteCategoryDialog}
          onOpenChange={(open) => {
            setShowDeleteCategoryDialog(open);
            if (!open) setSelectedCategory(null);
          }}
        />
      )}

      {selectedSpace && showDeleteSpaceDialog && (
        <DeleteSpaceDialog
          space={selectedSpace}
          isOpen={showDeleteSpaceDialog}
          onOpenChange={(open) => {
            setShowDeleteSpaceDialog(open);
            if (!open) setSelectedSpace(null);
          }}
        />
      )}
    </AdminLayout>
  );
};