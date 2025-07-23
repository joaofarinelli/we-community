import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { useUserPoints } from '@/hooks/useUserPoints';

export const UserPointsBadge = () => {
  const { data: userPoints, isLoading } = useUserPoints();

  if (isLoading) {
    return (
      <Badge variant="outline" className="animate-pulse">
        <Trophy className="h-3 w-3 mr-1" />
        ---
      </Badge>
    );
  }

  const points = userPoints?.total_points || 0;

  return (
    <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 transition-all duration-300">
      <Trophy className="h-3 w-3 mr-1 text-primary" />
      {points}
    </Badge>
  );
};