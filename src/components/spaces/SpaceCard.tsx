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
    isMember?: boolean;
    userRole?: string | null;
    memberCount?: number;
  };
  onClick?: () => void;
  className?: string;
  showJoinLeave?: boolean;
}

export const SpaceCard = ({ space, onClick, className, showJoinLeave = false }: SpaceCardProps) => {
  const { joinSpace, leaveSpace } = useManageSpaceMembers();
  
  // Use the new properties if available, fallback to old logic
  const memberCount = space.memberCount ?? (space.space_members?.length || 0);
  const userRole = space.userRole ?? (space.space_members?.[0]?.role || 'member');
  const isMember = space.isMember ?? (space.space_members && space.space_members.length > 0);
  
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
        "cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0 h-full flex flex-col">
        <div className="flex flex-col h-full">
          {/* Banner Section - Adaptive Height */}
          <div className="w-full flex-shrink-0">
            <div className="rounded-t-lg overflow-hidden">
              <SpaceBanner spaceId={space.id} className="w-full" />
            </div>
          </div>
          
          {/* Content Section - Flexible Height */}
          <div className="p-3 sm:p-4 md:p-6 flex flex-col justify-between flex-1">
            <div className="space-y-2 sm:space-y-3 flex-1">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="flex-shrink-0">
                    {renderSpaceIcon(
                      space.type,
                      space.custom_icon_type,
                      space.custom_icon_value,
                      "h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base md:text-lg leading-tight line-clamp-2">
                      {space.name}
                    </h3>
                    {space.space_categories && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1">
                        {space.space_categories.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {space.description && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {space.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <Badge 
                  variant="outline" 
                  className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 h-5 sm:h-6 flex items-center gap-1"
                >
                  {getVisibilityIcon()}
                  <span className="capitalize hidden sm:inline">{space.visibility}</span>
                </Badge>
                
                {userRole !== 'member' && (
                  <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 h-5 sm:h-6">
                    {userRole === 'admin' ? 'Admin' : 'Mod'}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">
                  {memberCount} {memberCount === 1 ? 'membro' : 'membros'}
                </span>
              </div>
            </div>
            
            {/* Footer Actions - Responsive Layout */}
            <div className="flex gap-1.5 sm:gap-2 mt-3 sm:mt-4">
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
                      className="flex-1 h-7 sm:h-8 md:h-9 text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <UserMinus className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                      <span className="hidden sm:inline">Sair</span>
                      <span className="sm:hidden">−</span>
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        joinSpace.mutate(space.id);
                      }}
                      disabled={joinSpace.isPending}
                      className="flex-1 h-7 sm:h-8 md:h-9 text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <UserPlus className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                      <span className="hidden sm:inline">
                        {joinSpace.isPending ? 'Entrando...' : 'Entrar'}
                      </span>
                      <span className="sm:hidden">+</span>
                    </Button>
                  )}
                </>
              )}
              
              {/* Access/View Button */}
              {(isMember || space.visibility === 'public') && (
                <Button 
                  size="sm" 
                  variant={isMember ? "default" : "outline"}
                  className={`
                    ${showJoinLeave && space.visibility === 'public' ? 'w-auto px-2 sm:px-3' : 'flex-1'} 
                    h-7 sm:h-8 md:h-9 text-xs sm:text-sm max-w-[200px]
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                  }}
                  disabled={!isMember && space.visibility !== 'public'}
                >
                  {isMember ? 'Acessar' : 'Ver'}
                </Button>
              )}
              
              {/* Restricted Access Message */}
              {!isMember && space.visibility !== 'public' && (
                <div className="flex-1 text-center py-1 sm:py-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {space.visibility === 'private' ? 'Restrito' : 'Secreto'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};