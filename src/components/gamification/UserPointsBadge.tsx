import { Badge } from '@/components/ui/badge';
import { Coins } from 'lucide-react';
import { useUserCoins } from '@/hooks/useUserPoints';

export const UserCoinsBadge = () => {
  const { data: userCoins, isLoading } = useUserCoins();

  if (isLoading) {
    return (
      <Badge variant="outline" className="animate-pulse">
        <Coins className="h-3 w-3 mr-1" />
        ---
      </Badge>
    );
  }

  const coins = userCoins?.total_coins || 0;

  return (
    <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 transition-all duration-300">
      <Coins className="h-3 w-3 mr-1 text-primary" />
      {coins} WomanCoins
    </Badge>
  );
};

// Keep the old component for backward compatibility
export const UserPointsBadge = UserCoinsBadge;