import { Badge } from '@/components/ui/badge';
import { Flame, Calendar } from 'lucide-react';
import { useUserStreak } from '@/hooks/useUserStreak';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export const StreakBadge = ({ variant = 'default', className }: StreakBadgeProps) => {
  const { streak, isLoading } = useUserStreak();

  if (isLoading) {
    return (
      <Badge variant="outline" className={cn("animate-pulse", className)}>
        <Flame className="h-3 w-3 mr-1" />
        ---
      </Badge>
    );
  }

  const currentStreak = streak?.current_streak || 0;
  const isActive = streak?.is_active || false;

  if (variant === 'compact') {
    return (
      <Badge 
        variant={isActive && currentStreak > 0 ? "default" : "outline"} 
        className={cn("transition-all duration-300", className)}
      >
        <Flame className={cn("h-3 w-3 mr-1", {
          "text-orange-500": isActive && currentStreak > 0,
          "text-gray-400": !isActive || currentStreak === 0
        })} />
        {currentStreak}
      </Badge>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn("flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20", className)}>
        <div className="flex items-center">
          <Flame className={cn("h-4 w-4 mr-2", {
            "text-orange-500": isActive && currentStreak > 0,
            "text-gray-400": !isActive || currentStreak === 0
          })} />
          <div className="text-sm">
            <div className="font-semibold">{currentStreak} dias</div>
            <div className="text-xs text-muted-foreground">
              {isActive ? 'Ofensiva ativa' : 'Sem ofensiva'}
            </div>
          </div>
        </div>
        {streak?.longest_streak && streak.longest_streak > currentStreak && (
          <div className="flex items-center text-xs text-muted-foreground border-l pl-2">
            <Calendar className="h-3 w-3 mr-1" />
            Recorde: {streak.longest_streak}
          </div>
        )}
      </div>
    );
  }

  return (
    <Badge 
      variant={isActive && currentStreak > 0 ? "secondary" : "outline"} 
      className={cn("bg-gradient-to-r transition-all duration-300", {
        "from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200 dark:from-orange-900/30 dark:to-red-900/30": isActive && currentStreak > 0,
        "from-gray-100 to-gray-100 hover:from-gray-200 hover:to-gray-200": !isActive || currentStreak === 0
      }, className)}
    >
      <Flame className={cn("h-3 w-3 mr-1", {
        "text-orange-600": isActive && currentStreak > 0,
        "text-gray-400": !isActive || currentStreak === 0
      })} />
      {currentStreak} {currentStreak === 1 ? 'dia' : 'dias'}
    </Badge>
  );
};