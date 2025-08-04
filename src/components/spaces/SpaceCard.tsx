import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        "group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-border bg-card w-full h-full flex flex-col overflow-hidden",
        className
      )}
      onClick={onClick}
    >
      <SpaceBanner spaceId={space.id} className="h-20 mb-0" />
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-2 min-h-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
            <div className="flex-shrink-0">
              {renderSpaceIcon(
                space.type,
                space.custom_icon_type,
                space.custom_icon_value,
                "h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8"
              )}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <CardTitle className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {space.name}
              </CardTitle>
              {space.space_categories && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {space.space_categories.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3 sm:space-y-4 p-3 sm:p-4 flex-1 flex flex-col min-h-0">
        {/* Description */}
        {space.description && (
          <div className="flex-shrink-0">
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 break-words">
              {space.description}
            </p>
          </div>
        )}
        
        {/* Badges */}
        <div className="flex flex-wrap gap-1 sm:gap-2 flex-shrink-0">
          <Badge 
            variant="secondary" 
            className={cn("text-xs flex items-center gap-1 px-2 py-0.5", getVisibilityColor())}
          >
            <span className="flex-shrink-0">{getVisibilityIcon()}</span>
            <span className="capitalize truncate max-w-[60px] sm:max-w-none">
              {space.visibility}
            </span>
          </Badge>
          
          {userRole !== 'member' && (
            <Badge 
              variant="secondary"
              className={cn("text-xs px-2 py-0.5", getRoleColor())}
            >
              <span className="truncate">
                {userRole === 'admin' ? 'Admin' : 'Moderador'}
              </span>
            </Badge>
          )}
        </div>
        
        {/* Spacer to push member count and actions to bottom */}
        <div className="flex-1"></div>
        
        {/* Member count and actions */}
        <div className="flex flex-col gap-2 sm:gap-3 flex-shrink-0">
          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">
              {memberCount} {memberCount === 1 ? 'membro' : 'membros'}
            </span>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
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
                      className="h-7 sm:h-8 px-2 sm:px-3 text-xs flex-shrink-0"
                    >
                      <UserMinus className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline ml-1">Sair</span>
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
                      className="h-7 sm:h-8 px-2 sm:px-3 text-xs flex-shrink-0"
                    >
                      <UserPlus className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline ml-1">Entrar</span>
                    </Button>
                  )}
                </>
              )}
            </div>
            
            <Button 
              size="sm" 
              variant="ghost"
              className="h-7 sm:h-8 px-2 sm:px-3 text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex-shrink-0"
            >
              <span className="truncate">Acessar</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};