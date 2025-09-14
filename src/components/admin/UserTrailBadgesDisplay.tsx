import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserTrailBadges } from '@/hooks/useTrailProgress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Award, 
  Star,
  Coins
} from 'lucide-react';

interface UserTrailBadgesDisplayProps {
  userId: string;
}

export const UserTrailBadgesDisplay = ({ userId }: UserTrailBadgesDisplayProps) => {
  const { data: trailBadges, isLoading } = useUserTrailBadges(userId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Badges de Trilhas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trailBadges || trailBadges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Badges de Trilhas
          </CardTitle>
          <CardDescription>
            Badges conquistados pelo usuário nas trilhas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Este usuário ainda não conquistou nenhum badge de trilha
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate total coins from badges
  const totalCoinsFromBadges = trailBadges.reduce((sum, badge) => {
    return sum + ((badge as any).trail_badges?.coins_reward || 0);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Badges de Trilhas
        </CardTitle>
        <CardDescription>
          {trailBadges.length} badge{trailBadges.length !== 1 ? 's' : ''} conquistado{trailBadges.length !== 1 ? 's' : ''} nas trilhas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics */}
        {totalCoinsFromBadges > 0 && (
          <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-yellow-600" />
              <span className="font-medium">Total de Moedas de Badges</span>
            </div>
            <span className="text-lg font-bold text-yellow-600">{totalCoinsFromBadges}</span>
          </div>
        )}

        {/* Badges Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trailBadges.map((userBadge) => {
            const badge = (userBadge as any).trail_badges;
            const trail = (userBadge as any).trails;
            
            return (
              <div key={userBadge.id} className="flex flex-col items-center space-y-3 p-4 border rounded-lg">
                {/* Badge Icon */}
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl"
                  style={{ backgroundColor: badge.color || '#8B5CF6' }}
                >
                  {badge.icon_name === 'Star' ? <Star className="w-8 h-8" /> : <Award className="w-8 h-8" />}
                </div>
                
                {/* Badge Info */}
                <div className="text-center space-y-1">
                  <h4 className="font-medium">{badge.name || 'Badge'}</h4>
                  <p className="text-sm text-muted-foreground">{trail.name}</p>
                  
                  {badge.description && (
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                  )}
                </div>

                {/* Badge Details */}
                <div className="flex flex-col items-center space-y-2 w-full">
                  {badge.badge_type && (
                    <Badge 
                      variant="outline" 
                      style={{ 
                        borderColor: badge.color || '#8B5CF6',
                        color: badge.color || '#8B5CF6'
                      }}
                    >
                      {badge.badge_type}
                    </Badge>
                  )}
                  
                  {badge.coins_reward > 0 && (
                    <div className="flex items-center gap-1 text-xs text-yellow-600">
                      <Coins className="h-3 w-3" />
                      {badge.coins_reward} moedas
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Conquistado em {format(new Date(userBadge.earned_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};