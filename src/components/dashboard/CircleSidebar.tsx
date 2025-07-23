import { useNavigate, useLocation } from 'react-router-dom';
import { ExternalLink, Video, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSpaceCategories } from '@/hooks/useSpaceCategories';
import { useSpaces } from '@/hooks/useSpaces';
import { useCreateSpace } from '@/hooks/useCreateSpace';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useReorderSpaces } from '@/hooks/useReorderSpaces';
import { useReorderCategories } from '@/hooks/useReorderCategories';
import { renderSpaceIcon } from '@/lib/spaceUtils';
import { SpaceTypeSelectionDialog } from './SpaceTypeSelectionDialog';
import { SpaceConfigurationDialog } from './SpaceConfigurationDialog';
import { CreateCategoryDialog } from './CreateCategoryDialog';
import { useCreateCategory } from '@/hooks/useCreateCategory';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
interface CircleSidebarProps {
  onClose?: () => void;
}
export function CircleSidebar({
  onClose
}: CircleSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    data: categories = []
  } = useSpaceCategories();
  const { toggleCategory, isCategoryExpanded, updateExpandedCategories, isLoading } = useUserPreferences();
  const reorderCategories = useReorderCategories();

  const categorySensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const {
    isTypeSelectionOpen,
    isConfigurationOpen,
    selectedType,
    selectedCategoryId,
    isCreating,
    openTypeSelection,
    selectTypeAndProceed,
    closeAllDialogs,
    createSpace
  } = useCreateSpace();

  const {
    isOpen: isCategoryDialogOpen,
    setIsOpen: setCategoryDialogOpen,
    createCategory,
    isLoading: isCreatingCategory
  } = useCreateCategory();

  const openCategoryDialog = () => setCategoryDialogOpen(true);
  const closeCategoryDialog = () => setCategoryDialogOpen(false);

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = categories.findIndex(cat => cat.id === active.id);
    const newIndex = categories.findIndex(cat => cat.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedCategories = arrayMove(categories, oldIndex, newIndex);

    const categoryUpdates = reorderedCategories.map((category, index) => ({
      id: category.id,
      order_index: index,
    }));

    reorderCategories.mutate({ categoryUpdates });
  };

  return <aside className="w-[280px] h-screen bg-card border-r border-border/50 flex flex-col">
      {/* Header */}
      

      {/* Content */}
      <div className="flex-1 p-6 space-y-1">

        {/* Feed */}
        <div>
          <Button 
            variant="ghost" 
            className={`w-full justify-start h-[34px] px-3 text-left text-[13px] font-medium transition-all duration-200 ${
              location.pathname === '/dashboard' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => navigate('/dashboard')}
          >
            📰 Feed
          </Button>
        </div>

        {/* Criar Categoria */}
        {categories.length > 0 && (
          <div>
            <Button 
              variant="ghost" 
              className="w-full justify-start h-[34px] px-3 text-left hover:bg-muted/50 text-muted-foreground text-[13px] font-medium"
              onClick={openCategoryDialog}
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar categoria
            </Button>
          </div>
        )}

        <Separator />

        {/* Categories and Spaces Section */}
        <div className="space-y-2">
          <DndContext
            sensors={categorySensors}
            collisionDetection={closestCenter}
            onDragEnd={handleCategoryDragEnd}
          >
            <SortableContext
              items={categories.map(cat => cat.id)}
              strategy={verticalListSortingStrategy}
            >
              {categories.map(category => (
                <DraggableCategorySection 
                  key={category.id} 
                  category={category} 
                  isExpanded={isCategoryExpanded(category.id)} 
                  onToggle={() => toggleCategory(category.id)} 
                  onCreateSpace={openTypeSelection} 
                  onSpaceClick={spaceId => navigate(`/dashboard/space/${spaceId}`)} 
                  currentPath={location.pathname} 
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

      </div>

      {/* Footer */}
      

      {/* Dialogs de Criação de Espaço */}
      <SpaceTypeSelectionDialog open={isTypeSelectionOpen} onClose={closeAllDialogs} onSelectType={selectTypeAndProceed} />
      
      <SpaceConfigurationDialog open={isConfigurationOpen} onClose={closeAllDialogs} onCreateSpace={createSpace} selectedType={selectedType} selectedCategoryId={selectedCategoryId} isCreating={isCreating} />

      {/* Dialog de Criação de Categoria */}
      <CreateCategoryDialog 
        isOpen={isCategoryDialogOpen}
        onClose={closeCategoryDialog}
        onSubmit={createCategory}
        isLoading={isCreatingCategory}
      />
    </aside>;
}

// Component for draggable space item
interface DraggableSpaceItemProps {
  space: any;
  isActive: boolean;
  onSpaceClick: (spaceId: string) => void;
}

const DraggableSpaceItem = ({ space, isActive, onSpaceClick }: DraggableSpaceItemProps) => {
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
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center group"
    >
      <div 
        className="flex-shrink-0 p-1 cursor-grab hover:bg-muted/30 rounded transition-colors mr-1 opacity-0 group-hover:opacity-100" 
        {...listeners}
      >
        <div className="w-3 h-4 flex flex-col justify-center items-center gap-0.5">
          <div className="w-1 h-0.5 bg-muted-foreground/60 rounded-full"></div>
          <div className="w-1 h-0.5 bg-muted-foreground/60 rounded-full"></div>
          <div className="w-1 h-0.5 bg-muted-foreground/60 rounded-full"></div>
        </div>
      </div>
      <Button 
        variant="ghost" 
        onClick={() => onSpaceClick(space.id)} 
        className={`flex-1 justify-start p-2 h-auto text-left text-sm transition-all duration-200 ${
          isActive 
            ? 'bg-primary text-primary-foreground shadow-sm' 
            : 'hover:bg-muted/50'
        }`}
      >
        <div className="h-4 w-4 mr-2 flex items-center justify-center">
          {renderSpaceIcon(space.type, space.custom_icon_type, space.custom_icon_value, "h-4 w-4")}
        </div>
        <span className={space.is_private && !isActive ? "text-muted-foreground" : ""}>{space.name}</span>
      </Button>
    </div>
  );
};

interface DraggableCategorySectionProps {
  category: any;
  isExpanded: boolean;
  onToggle: () => void;
  onCreateSpace: (categoryId: string) => void;
  onSpaceClick: (spaceId: string) => void;
  currentPath: string;
}

const DraggableCategorySection = ({ 
  category, 
  isExpanded, 
  onToggle, 
  onCreateSpace, 
  onSpaceClick, 
  currentPath 
}: DraggableCategorySectionProps) => {
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
    <div ref={setNodeRef} style={style}>
      <SpaceCategorySection
        category={category}
        isExpanded={isExpanded}
        onToggle={onToggle}
        onCreateSpace={onCreateSpace}
        onSpaceClick={onSpaceClick}
        currentPath={currentPath}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

interface SpaceCategorySectionProps {
  category: any;
  isExpanded: boolean;
  onToggle: () => void;
  onCreateSpace: (categoryId: string) => void;
  onSpaceClick: (spaceId: string) => void;
  currentPath: string;
  dragHandleProps?: any;
}

function SpaceCategorySection({
  category,
  isExpanded,
  onToggle,
  onCreateSpace,
  onSpaceClick,
  currentPath,
  dragHandleProps
}: SpaceCategorySectionProps) {
  const { data: spaces = [] } = useSpaces(category.id);
  const reorderSpacesMutation = useReorderSpaces();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = spaces.findIndex((space) => space.id === active.id);
      const newIndex = spaces.findIndex((space) => space.id === over?.id);
      
      const reorderedSpaces = arrayMove(spaces, oldIndex, newIndex);
      
      // Create updates with new order indices
      const spaceUpdates = reorderedSpaces.map((space, index) => ({
        id: space.id,
        order_index: index,
      }));

      reorderSpacesMutation.mutate({
        categoryId: category.id,
        spaceUpdates,
      });
    }
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div className="w-full group flex items-center">
          <div 
            className="flex-shrink-0 p-1 cursor-grab hover:bg-muted/30 rounded transition-colors mr-1" 
            {...dragHandleProps}
          >
            <div className="w-3 h-4 flex flex-col justify-center items-center gap-0.5">
              <div className="w-1 h-0.5 bg-muted-foreground/60 rounded-full"></div>
              <div className="w-1 h-0.5 bg-muted-foreground/60 rounded-full"></div>
              <div className="w-1 h-0.5 bg-muted-foreground/60 rounded-full"></div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="flex-1 justify-between p-3 h-auto text-left hover:bg-muted/50 cursor-pointer"
          >
            <span className="text-sm font-medium text-muted-foreground">{category.name}</span>
            <div className="flex items-center gap-1">
              {spaces.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Plus clicked for category:', category.id);
                    onCreateSpace(category.id);
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </Button>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-1 ml-3">
        {spaces.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={spaces.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {spaces.map(space => {
                const isActiveSpace = currentPath === `/dashboard/space/${space.id}`;
                return (
                  <DraggableSpaceItem
                    key={space.id}
                    space={space}
                    isActive={isActiveSpace}
                    onSpaceClick={onSpaceClick}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        ) : (
          <Button variant="ghost" className="w-full justify-start p-2 h-auto text-left hover:bg-muted/50 text-muted-foreground text-sm" onClick={() => onCreateSpace(category.id)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar espaço
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}