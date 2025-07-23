import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';

interface RankingCardProps {
  rank: number;
  user: any; // Simplified type for now
  isCurrentUser?: boolean;
}

export const RankingCard = ({ rank, user, isCurrentUser = false }: RankingCardProps) => {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{position}</span>;
    }
  };

  const getRankBadgeVariant = (position: number) => {
    if (position <= 3) return "default";
    return "secondary";
  };

  const cardClassName = isCurrentUser 
    ? "border-primary bg-gradient-to-r from-primary/5 to-secondary/5" 
    : "";

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${cardClassName}`}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex items-center justify-center w-8 h-8">
          {getRankIcon(rank)}
        </div>
        
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
            {user.profiles 
              ? getInitials(user.profiles.first_name, user.profiles.last_name)
              : '?'
            }
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="font-medium">
            {user.profiles 
              ? `${user.profiles.first_name} ${user.profiles.last_name}`
              : 'Usuário'
            }
          </div>
          {isCurrentUser && (
            <span className="text-xs text-primary font-medium">Você</span>
          )}
        </div>
        
        <Badge variant={getRankBadgeVariant(rank)} className="font-semibold">
          {user.total_points} pts
        </Badge>
      </CardContent>
    </Card>
  );
};