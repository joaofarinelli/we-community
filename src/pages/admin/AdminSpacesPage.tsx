import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSpaceCategories } from '@/hooks/useSpaceCategories';
import { useSpaces } from '@/hooks/useSpaces';
import { useReorderCategories } from '@/hooks/useReorderCategories';
import { useReorderSpaces } from '@/hooks/useReorderSpaces';
import { AdminCreateCategoryDialog } from '@/components/admin/AdminCreateCategoryDialog';
import { AdminEditCategoryDialog } from '@/components/admin/AdminEditCategoryDialog';
import { SpaceTypeSelectionDialog } from '@/components/dashboard/SpaceTypeSelectionDialog';
import { SpaceConfigurationDialog } from '@/components/dashboard/SpaceConfigurationDialog';
import { useCreateSpace } from '@/hooks/useCreateSpace';
import { EditSpaceDialog } from '@/components/admin/EditSpaceDialog';
import { DeleteSpaceDialog } from '@/components/admin/DeleteSpaceDialog';
import { DeleteCategoryDialog } from '@/components/admin/DeleteCategoryDialog';
import { Plus, Pencil, Trash2, Users, MessageSquare, GripVertical, ArrowUpDown } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Component for sortable category card
const SortableCategoryCard = ({ 
  category, 
  isReordering, 
  onEdit, 
  onDelete, 
  getSpacesByCategory, 
  getSpaceCountByCategory, 
  getVisibilityBadge 
}: {
  category: any;
  isReordering: boolean;
  onEdit: (category: any) => void;
  onDelete: (category: any) => void;
  getSpacesByCategory: (categoryId: string) => any[];
  getSpaceCountByCategory: (categoryId: string) => number;
  getVisibilityBadge: (visibility: string) => React.ReactNode;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className={`hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isReordering && (
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <CardDescription>
                {getSpaceCountByCategory(category.id)} espaço(s)
              </CardDescription>
            </div>
          </div>
          {!isReordering && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(category)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(category)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
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
  );
};

// Component for sortable space card
const SortableSpaceCard = ({ 
  space, 
  isReordering, 
  onEdit, 
  onDelete, 
  getVisibilityBadge 
}: {
  space: any;
  isReordering: boolean;
  onEdit: (space: any) => void;
  onDelete: (space: any) => void;
  getVisibilityBadge: (visibility: string) => React.ReactNode;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: space.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className={`hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isReordering && (
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div>
              <CardTitle className="text-base truncate">{space.name}</CardTitle>
              {space.description && (
                <CardDescription className="line-clamp-2">
                  {space.description}
                </CardDescription>
              )}
            </div>
          </div>
          {!isReordering && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(space)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(space)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
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
  );
};

export const AdminSpacesPage = () => {
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedSpace, setSelectedSpace] = useState<any>(null);
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false);
  const [showDeleteSpaceDialog, setShowDeleteSpaceDialog] = useState(false);
  const [isReorderingCategories, setIsReorderingCategories] = useState(false);
  const [isReorderingSpaces, setIsReorderingSpaces] = useState(false);
  const [reorderingCategoryId, setReorderingCategoryId] = useState<string | null>(null);
  
  const { data: categories = [], isLoading: categoriesLoading } = useSpaceCategories();
  const { data: spaces = [], isLoading: spacesLoading } = useSpaces();
  const reorderCategories = useReorderCategories();
  const reorderSpaces = useReorderSpaces();
  
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories?.findIndex(item => item.id === active.id) ?? -1;
      const newIndex = categories?.findIndex(item => item.id === over.id) ?? -1;

      if (oldIndex !== -1 && newIndex !== -1 && categories) {
        const reorderedCategories = arrayMove(categories, oldIndex, newIndex);
        
        const categoryUpdates = reorderedCategories.map((category, index) => ({
          id: category.id,
          order_index: index,
        }));

        reorderCategories.mutate({ categoryUpdates });
      }
    }
  };

  const handleSpaceDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && reorderingCategoryId) {
      const categorySpaces = reorderingCategoryId === 'uncategorized' 
        ? spaces.filter(space => !space.category_id)
        : getSpacesByCategory(reorderingCategoryId);
      
      const oldIndex = categorySpaces.findIndex(item => item.id === active.id) ?? -1;
      const newIndex = categorySpaces.findIndex(item => item.id === over.id) ?? -1;

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedSpaces = arrayMove(categorySpaces, oldIndex, newIndex);
        
        const spaceUpdates = reorderedSpaces.map((space, index) => ({
          id: space.id,
          order_index: index,
        }));

        reorderSpaces.mutate({ 
          categoryId: reorderingCategoryId === 'uncategorized' ? '' : reorderingCategoryId,
          spaceUpdates 
        });
      }
    }
  };

  const handleToggleCategoryReordering = () => {
    setIsReorderingCategories(!isReorderingCategories);
    if (isReorderingSpaces) {
      setIsReorderingSpaces(false);
      setReorderingCategoryId(null);
    }
  };

  const handleToggleSpaceReordering = (categoryId?: string) => {
    const newIsReordering = !isReorderingSpaces;
    setIsReorderingSpaces(newIsReordering);
    setReorderingCategoryId(newIsReordering ? (categoryId || null) : null);
    if (isReorderingCategories) {
      setIsReorderingCategories(false);
    }
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
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {categories.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleCategoryReordering}
                    className="gap-2"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    {isReorderingCategories ? 'Finalizar Reordenação' : 'Reordenar Categorias'}
                  </Button>
                )}
              </div>
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleCategoryDragEnd}
              >
                <SortableContext
                  items={categories?.map(c => c.id) ?? []}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                    {categories.map((category) => (
                      <SortableCategoryCard
                        key={category.id}
                        category={category}
                        isReordering={isReorderingCategories}
                        onEdit={handleEditCategory}
                        onDelete={handleDeleteCategory}
                        getSpacesByCategory={getSpacesByCategory}
                        getSpaceCountByCategory={getSpaceCountByCategory}
                        getVisibilityBadge={getVisibilityBadge}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground">{category.name}</h3>
                        {categorySpaces.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleSpaceReordering(category.id)}
                            className="gap-2"
                          >
                            <ArrowUpDown className="h-4 w-4" />
                            {isReorderingSpaces && reorderingCategoryId === category.id ? 'Finalizar' : 'Reordenar'}
                          </Button>
                        )}
                      </div>

                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleSpaceDragEnd}
                      >
                        <SortableContext
                          items={categorySpaces?.map(s => s.id) ?? []}
                          strategy={rectSortingStrategy}
                        >
                          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                            {categorySpaces.map((space) => (
                              <SortableSpaceCard
                                key={space.id}
                                space={space}
                                isReordering={isReorderingSpaces && reorderingCategoryId === category.id}
                                onEdit={handleEditSpace}
                                onDelete={handleDeleteSpace}
                                getVisibilityBadge={getVisibilityBadge}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  );
                })}
                
                {/* Espaços sem categoria */}
                {spaces.filter(space => !space.category_id).length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">Sem categoria</h3>
                      {spaces.filter(space => !space.category_id).length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleSpaceReordering('uncategorized')}
                          className="gap-2"
                        >
                          <ArrowUpDown className="h-4 w-4" />
                          {isReorderingSpaces && reorderingCategoryId === 'uncategorized' ? 'Finalizar' : 'Reordenar'}
                        </Button>
                      )}
                    </div>

                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleSpaceDragEnd}
                    >
                      <SortableContext
                        items={spaces.filter(space => !space.category_id)?.map(s => s.id) ?? []}
                        strategy={rectSortingStrategy}
                      >
                        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                          {spaces.filter(space => !space.category_id).map((space) => (
                            <SortableSpaceCard
                              key={space.id}
                              space={space}
                              isReordering={isReorderingSpaces && reorderingCategoryId === 'uncategorized'}
                              onEdit={handleEditSpace}
                              onDelete={handleDeleteSpace}
                              getVisibilityBadge={getVisibilityBadge}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
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