import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { TrailBadge } from '@/hooks/useTrailBadges';
import * as LucideIcons from 'lucide-react';

interface TrailBadgeCardProps {
  badge: TrailBadge;
  onEdit: (badge: TrailBadge) => void;
  onDelete: (badge: TrailBadge) => void;
  onToggleActive: (badge: TrailBadge) => void;
}

export const TrailBadgeCard = ({ badge, onEdit, onDelete, onToggleActive }: TrailBadgeCardProps) => {
  const IconComponent = (LucideIcons as any)[badge.icon_name || 'Award'] || LucideIcons.Award;

  const badgeTypeLabels = {
    completion: 'Conclusão',
    milestone: 'Marco',
    achievement: 'Conquista',
  };

  return (
    <Card className={`relative ${!badge.is_active ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: badge.background_color || badge.color || '#1E40AF' }}
            >
              <IconComponent 
                className="w-6 h-6" 
                style={{ color: badge.icon_color || '#FFD700' }}
              />
            </div>
            <div>
              <CardTitle className="text-lg">{badge.name}</CardTitle>
              <Badge variant="secondary" className="mt-1">
                {badgeTypeLabels[badge.badge_type]}
              </Badge>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(badge)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive(badge)}>
                {badge.is_active ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Desativar
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(badge)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        {badge.description && (
          <p className="text-muted-foreground mb-3 text-sm">
            {badge.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Recompensa:</span>
            <Badge variant="outline">
              {badge.coins_reward || 0} moedas
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={badge.is_active ? 'text-green-600' : 'text-gray-500'}>
              {badge.is_active ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};