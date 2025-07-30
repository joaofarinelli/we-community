import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TrailBadge {
  id: string;
  trail_id: string;
  badge_id: string;
  earned_at: string;
  trail_badges: {
    name: string;
    description: string;
    icon_name: string;
    color: string;
    badge_type: string;
    coins_reward: number;
  };
  trails: {
    name: string;
  };
}

interface TrailBadgesDisplayProps {
  badges: TrailBadge[];
}

export const TrailBadgesDisplay = ({ badges }: TrailBadgesDisplayProps) => {
  const getDynamicIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || LucideIcons.Award;
  };

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
          {badges.map((userBadge) => {
            const Icon = getDynamicIcon(userBadge.trail_badges.icon_name);
            
            return (
              <div
                key={userBadge.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-full"
                  style={{ backgroundColor: userBadge.trail_badges.color + '20' }}
                >
                  <Icon 
                    className="h-6 w-6" 
                    style={{ color: userBadge.trail_badges.color }}
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{userBadge.trail_badges.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      +{userBadge.trail_badges.coins_reward}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {userBadge.trail_badges.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {userBadge.trails.name}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(userBadge.earned_at), 'dd/MM/yyyy', { locale: ptBR })}
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