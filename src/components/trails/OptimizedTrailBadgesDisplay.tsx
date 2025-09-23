import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrailBadgeData } from '@/hooks/useTrailsDashboardData';

interface OptimizedTrailBadgesDisplayProps {
  badges: TrailBadgeData[];
  isLoading: boolean;
}

export const OptimizedTrailBadgesDisplay = ({ badges, isLoading }: OptimizedTrailBadgesDisplayProps) => {
  const getDynamicIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || LucideIcons.Award;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seus Selos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <Skeleton className="h-3 w-32" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-16" />
                    <span className="text-xs text-muted-foreground">•</span>
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (badges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seus Selos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Você ainda não conquistou nenhum selo. Complete etapas das suas trilhas para ganhar seus primeiros selos!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Seus Selos ({badges.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => {
            const Icon = getDynamicIcon(badge.badge_icon_name);
            
            return (
              <div
                key={badge.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-full"
                  style={{ backgroundColor: badge.badge_color + '20' }}
                >
                  <Icon 
                    className="h-6 w-6" 
                    style={{ color: badge.badge_color }}
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{badge.badge_name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      +{badge.coins_reward}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {badge.badge_description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {badge.trail_name}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(badge.earned_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};