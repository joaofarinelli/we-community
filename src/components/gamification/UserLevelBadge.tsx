import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserLevel } from '@/hooks/useUserLevel';
import { useCoinName } from '@/hooks/useCoinName';
import * as Icons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface UserLevelBadgeProps {
  userId?: string;
  showProgress?: boolean;
}

export const UserLevelBadge = ({ userId, showProgress = false }: UserLevelBadgeProps) => {
  const { data: userLevel, isLoading } = useUserLevel(userId);
  const { data: coinName = 'WomanCoins' } = useCoinName();

  if (isLoading) {
    return (
      <Badge variant="outline" className="animate-pulse">
        ---
      </Badge>
    );
  }

  if (!userLevel?.user_levels) {
    return (
      <Badge variant="outline">
        Sem Nível
      </Badge>
    );
  }

  const level = userLevel.user_levels;
  const IconComponent = (Icons as any)[level.level_icon] as React.ComponentType<LucideProps>;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary" 
            className="transition-all duration-300"
            style={{ 
              backgroundColor: `${level.level_color}15`,
              borderColor: level.level_color,
              color: level.level_color
            }}
          >
            {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
            {level.level_name}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-semibold">{level.level_name}</p>
            <p className="text-sm text-muted-foreground">
              {userLevel.current_coins} {coinName}
            </p>
            {showProgress && userLevel.next_level && (
              <div className="mt-2">
                <p className="text-xs">
                  Progresso para {userLevel.next_level.level_name}:
                </p>
                <div className="w-20 bg-secondary rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${userLevel.progress_percentage}%` }}
                  />
                </div>
                <p className="text-xs mt-1">
                  {userLevel.coins_to_next_level} coins restantes
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};