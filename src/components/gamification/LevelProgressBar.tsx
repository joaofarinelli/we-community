import { Progress } from '@/components/ui/progress';
import { useUserLevel } from '@/hooks/useUserLevel';
import { useCoinName } from '@/hooks/useCoinName';
import * as Icons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface LevelProgressBarProps {
  userId?: string;
  showLabels?: boolean;
}

export const LevelProgressBar = ({ userId, showLabels = true }: LevelProgressBarProps) => {
  const { data: userLevel, isLoading } = useUserLevel(userId);
  const { data: coinName = 'WomanCoins' } = useCoinName();

  if (isLoading || !userLevel?.user_levels) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-2 w-full bg-muted rounded animate-pulse" />
      </div>
    );
  }

  const level = userLevel.user_levels;
  const nextLevel = userLevel.next_level;
  const IconComponent = (Icons as any)[level.level_icon] as React.ComponentType<LucideProps>;
  const NextIconComponent = nextLevel ? (Icons as any)[nextLevel.level_icon] as React.ComponentType<LucideProps> : null;

  return (
    <div className="space-y-2">
      {showLabels && (
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-1" style={{ color: level.level_color }}>
            {IconComponent && <IconComponent className="h-4 w-4" />}
            <span className="font-medium">{level.level_name}</span>
          </div>
          {nextLevel && (
            <div className="flex items-center gap-1 text-muted-foreground">
              {NextIconComponent && <NextIconComponent className="h-4 w-4" />}
              <span>{nextLevel.level_name}</span>
            </div>
          )}
        </div>
      )}
      
      <div className="relative">
        <Progress 
          value={userLevel.progress_percentage} 
          className="h-3"
        />
        {nextLevel && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">
            <span className="text-xs font-medium text-primary-foreground">
              {Math.round(userLevel.progress_percentage)}%
            </span>
          </div>
        )}
      </div>

      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{userLevel.current_coins} {coinName}</span>
          {nextLevel && (
            <span>
              {userLevel.coins_to_next_level} restantes para próximo nível
            </span>
          )}
        </div>
      )}

      {!nextLevel && showLabels && (
        <div className="text-center text-sm text-muted-foreground">
          🏆 Nível máximo alcançado!
        </div>
      )}
    </div>
  );
};