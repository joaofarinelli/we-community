import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SpaceBanner } from '@/components/ui/space-banner';
import { renderSpaceIcon } from '@/lib/spaceUtils';
import { Users, Lock, Eye, EyeOff, UserPlus, UserMinus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useManageSpaceMembers } from '@/hooks/useManageSpaceMembers';

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
  showJoinLeave?: boolean;
}

export const SpaceCard = ({ space, onClick, className, showJoinLeave = false }: SpaceCardProps) => {
  const { joinSpace, leaveSpace } = useManageSpaceMembers();
  const memberCount = space.space_members?.length || 0;
  const userRole = space.space_members?.[0]?.role || 'member';
  const isMember = space.space_members && space.space_members.length > 0;
  
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
        "h-full flex flex-col cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex-1">
        <SpaceBanner spaceId={space.id} className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden" />
        
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex-shrink-0">
                {renderSpaceIcon(
                  space.type,
                  space.custom_icon_type,
                  space.custom_icon_value,
                  "h-5 w-5"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-sm leading-tight truncate">{space.name}</h3>
                {space.space_categories && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {space.space_categories.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {space.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {space.description}
            </p>
          )}
          
          <div className="flex flex-wrap gap-1">
            <Badge 
              variant="outline" 
              className="text-xs flex items-center gap-1"
            >
              {getVisibilityIcon()}
              <span className="capitalize">{space.visibility}</span>
            </Badge>
            
            {userRole !== 'member' && (
              <Badge variant="secondary" className="text-xs">
                {userRole === 'admin' ? 'Admin' : 'Moderador'}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{memberCount} {memberCount === 1 ? 'membro' : 'membros'}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <div className="flex gap-2 w-full">
          {showJoinLeave && space.visibility === 'public' && (
            <>
              {isMember ? (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    leaveSpace.mutate(space.id);
                  }}
                  disabled={leaveSpace.isPending}
                  className="flex-1"
                >
                  <UserMinus className="h-3 w-3 mr-1" />
                  Sair
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    joinSpace.mutate(space.id);
                  }}
                  disabled={joinSpace.isPending}
                  className="flex-1"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Entrar
                </Button>
              )}
            </>
          )}
          
          <Button 
            size="sm" 
            variant="outline"
            className={showJoinLeave && space.visibility === 'public' ? "flex-1" : "w-full"}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            Acessar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};