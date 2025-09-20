import { useState } from 'react';
import { Edit, Trash2, Copy, Eye, Pin, GripVertical, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTrailTemplates, useDeleteTrailTemplate, TrailTemplate } from '@/hooks/useTrailTemplates';
import { useReorderTrailTemplates } from '@/hooks/useReorderTrailTemplates';
import { TrailPinButton } from '../../trails/TrailPinButton';
import { ViewTrailTemplateDialog } from './ViewTrailTemplateDialog';
import { EditTrailTemplateDialog } from './EditTrailTemplateDialog';
import { CopyTrailTemplateDialog } from './CopyTrailTemplateDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

// Component for sortable trail card
const SortableTrailCard = ({ template, isReordering, onView, onEdit, onCopy, onDelete, deleteTemplate }: {
  template: TrailTemplate;
  isReordering: boolean;
  onView: (template: TrailTemplate) => void;
  onEdit: (template: TrailTemplate) => void;
  onCopy: (template: TrailTemplate) => void;
  onDelete: (id: string) => void;
  deleteTemplate: any;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: template.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className={`hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg' : ''}`}>
      <CardHeader className="space-y-1">
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
            <CardTitle className="text-lg">{template.name}</CardTitle>
            {template.is_pinned && (
              <div className="flex items-center gap-1">
                <Pin className="h-4 w-4 text-primary" />
                <Badge variant="secondary" className="text-xs">Fixada</Badge>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <TrailPinButton template={template} />
          </div>
        </div>
        {template.description && (
          <CardDescription className="line-clamp-2">
            {template.description}
          </CardDescription>
        )}
      </CardHeader>

      {template.cover_url && (
        <div className="px-6 pb-4">
          <div className="w-full h-32 bg-muted rounded-lg overflow-hidden">
            <img 
              src={template.cover_url} 
              alt={`Capa da trilha ${template.name}`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      <CardContent className="space-y-4">
        {/* Details */}
        <div className="space-y-2 text-sm text-muted-foreground">
          {template.life_area && (
            <div>
              <span className="font-medium">Área da vida:</span> {template.life_area}
            </div>
          )}
          <div>
            <span className="font-medium">Criado em:</span>{' '}
            {template.created_at && !isNaN(new Date(template.created_at).getTime())
              ? format(new Date(template.created_at), 'dd/MM/yyyy', { locale: ptBR })
              : 'Data não disponível'
            }
          </div>
        </div>

        {/* Actions */}
        {!isReordering && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onView(template)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onEdit(template)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onCopy(template)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onDelete(template.id)}
              disabled={deleteTemplate.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const AdminTrailsTab = () => {
  const { data: templates, isLoading } = useTrailTemplates();
  const deleteTemplate = useDeleteTrailTemplate();
  const reorderTemplates = useReorderTrailTemplates();
  
  const [selectedTemplate, setSelectedTemplate] = useState<TrailTemplate | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja desativar esta trilha?')) {
      await deleteTemplate.mutateAsync(id);
    }
  };

  const handleView = (template: TrailTemplate) => {
    setSelectedTemplate(template);
    setViewDialogOpen(true);
  };

  const handleEdit = (template: TrailTemplate) => {
    setSelectedTemplate(template);
    setEditDialogOpen(true);
  };

  const handleCopy = (template: TrailTemplate) => {
    setSelectedTemplate(template);
    setCopyDialogOpen(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = templates?.findIndex((item) => item.id === active.id) ?? -1;
      const newIndex = templates?.findIndex((item) => item.id === over.id) ?? -1;

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedTemplates = arrayMove(templates!, oldIndex, newIndex);
        
        // Create updates array with new order_index values
        const trailUpdates = reorderedTemplates.map((template, index) => ({
          id: template.id,
          order_index: index,
        }));

        reorderTemplates.mutate({ trailUpdates });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground mb-4">
            Nenhuma trilha criada ainda.
          </p>
          <p className="text-sm text-muted-foreground">
            Crie trilhas completas para que as usuárias possam participar e evoluir em suas jornadas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Reorder Controls */}
      {templates && templates.length > 1 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReordering(!isReordering)}
            className="gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            {isReordering ? 'Finalizar Reordenação' : 'Reordenar Trilhas'}
          </Button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={templates?.map(t => t.id) ?? []}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates?.map((template) => (
              <SortableTrailCard
                key={template.id}
                template={template}
                isReordering={isReordering}
                onView={handleView}
                onEdit={handleEdit}
                onCopy={handleCopy}
                onDelete={handleDelete}
                deleteTemplate={deleteTemplate}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Dialogs */}
      <ViewTrailTemplateDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        template={selectedTemplate}
      />

      <EditTrailTemplateDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        template={selectedTemplate}
      />

      <CopyTrailTemplateDialog
        open={copyDialogOpen}
        onOpenChange={setCopyDialogOpen}
        template={selectedTemplate}
      />
    </div>
  );
};