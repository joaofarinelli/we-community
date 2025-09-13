import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Coins, Calendar } from 'lucide-react';
import { useLastPlacedUsers } from '@/hooks/useLastPlacedUsers';
import { Skeleton } from '@/components/ui/skeleton';

export const LastPlacedSidebar = () => {
  const { data: lastPlacedUsers, isLoading } = useLastPlacedUsers();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getPreviousMonthName = () => {
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    return previousMonth.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    }).replace(/^\w/, c => c.toUpperCase());
  };

  if (!lastPlacedUsers || lastPlacedUsers.length === 0) {
    return null;
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Últimos de {getPreviousMonthName()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))
        ) : (
          lastPlacedUsers.map((user) => (
            <div 
              key={user.user_id} 
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-center w-6 h-6">
                <span className="text-sm font-semibold text-muted-foreground">
                  #{user.final_rank}
                </span>
              </div>
              
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-xs">
                  {user.profiles 
                    ? getInitials(user.profiles.first_name, user.profiles.last_name)
                    : '?'
                  }
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.profiles 
                    ? `${user.profiles.first_name} ${user.profiles.last_name}`
                    : 'Usuário'
                  }
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                <Coins className="h-3 w-3 text-amber-500" />
                <span className="text-sm font-medium">{user.monthly_coins}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};