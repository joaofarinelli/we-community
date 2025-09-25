import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, Shield, MoreHorizontal, Edit, Trash2, GripVertical } from 'lucide-react';
import { spaceTypes } from '@/lib/spaceUtils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SpaceMobileCardProps {
  space: any;
  categoryName: string;
  membersCount: { total: number; moderators: number };
  onEdit: (space: any) => void;
  onDelete: (space: any) => void;
  isDraggable?: boolean;
}

export const SpaceMobileCard = ({ 
  space, 
  categoryName, 
  membersCount, 
  onEdit, 
  onDelete,
  isDraggable = false
}: SpaceMobileCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: space.id,
    disabled: !isDraggable
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Badge variant="default">Público</Badge>;
      case 'private':
        return <Badge variant="secondary">Privado</Badge>;
      case 'secret':
        return <Badge variant="destructive">Secreto</Badge>;
      default:
        return <Badge variant="outline">{visibility}</Badge>;
    }
  };

  const getTypeDisplay = (type: string) => {
    const spaceType = spaceTypes.find(st => st.type === type);
    return spaceType?.name || type;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border rounded-lg p-4 space-y-3 ${isDragging ? 'shadow-lg' : ''}`}
    >
      {/* Header with name and drag handle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isDraggable && (
            <div
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/50 rounded"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
          <h3 className="font-semibold truncate">{space.name}</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onEdit(space)} className="cursor-pointer">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive cursor-pointer"
              onClick={() => onDelete(space)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Space details */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">Categoria</span>
          <p className="font-medium truncate">{categoryName}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Tipo</span>
          <p className="font-medium">{getTypeDisplay(space.type)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Membros</span>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span className="font-medium">{membersCount.total}</span>
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Moderadores</span>
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            <span className="font-medium">{membersCount.moderators}</span>
          </div>
        </div>
      </div>

      {/* Access badge */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Acesso</span>
        {getVisibilityBadge(space.visibility)}
      </div>
    </div>
  );
};