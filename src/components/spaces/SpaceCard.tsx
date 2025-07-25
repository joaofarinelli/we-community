import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { renderSpaceIcon } from '@/lib/spaceUtils';
import { Users, Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpaceCardProps {
  space: {
    id: string;
    name: string;
    description?: string;
    type: string;
    visibility: string;
    custom_icon_type?: string;
    custom_icon_value?: string;
    space_members?: Array<{ role: string; joined_at: string }>;
    space_categories?: { id: string; name: string } | null;
  };
  onClick?: () => void;
  className?: string;
}

export const SpaceCard = ({ space, onClick, className }: SpaceCardProps) => {
  const memberCount = space.space_members?.length || 0;
  const userRole = space.space_members?.[0]?.role || 'member';
  
  const getVisibilityIcon = () => {
    switch (space.visibility) {
      case 'public':
        return <Eye className="h-3 w-3" />;
      case 'private':
        return <Lock className="h-3 w-3" />;
      case 'secret':
        return <EyeOff className="h-3 w-3" />;
      default:
        return <Eye className="h-3 w-3" />;
    }
  };

  const getVisibilityColor = () => {
    switch (space.visibility) {
      case 'public':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'private':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'secret':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRoleColor = () => {
    switch (userRole) {
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'moderator':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-border bg-card",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {renderSpaceIcon(
                space.type,
                space.custom_icon_type,
                space.custom_icon_value,
                "h-8 w-8"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {space.name}
              </CardTitle>
              {space.space_categories && (
                <p className="text-xs text-muted-foreground mt-1">
                  {space.space_categories.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {space.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {space.description}
          </p>
        )}
        
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant="secondary" 
            className={cn("text-xs", getVisibilityColor())}
          >
            {getVisibilityIcon()}
            <span className="ml-1 capitalize">{space.visibility}</span>
          </Badge>
          
          {userRole !== 'member' && (
            <Badge 
              variant="secondary"
              className={cn("text-xs", getRoleColor())}
            >
              {userRole === 'admin' ? 'Admin' : 'Moderador'}
            </Badge>
          )}
        </div>
        
        {/* Member count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{memberCount} {memberCount === 1 ? 'membro' : 'membros'}</span>
          </div>
          
          <Button 
            size="sm" 
            variant="ghost"
            className="h-8 px-3 text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          >
            Acessar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};