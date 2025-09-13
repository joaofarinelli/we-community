import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTrailBadges } from '@/hooks/useTrailProgress';

export const TrailBadgesTab = () => {
  const { data: badges, isLoading } = useTrailBadges();

  const getDynamicIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || LucideIcons.Award;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!badges || badges.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground mb-4">
            Nenhum selo configurado ainda.
          </p>
          <p className="text-sm text-muted-foreground">
            Os selos padrão serão criados automaticamente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {(badges as any).map((badge: any) => {
        const Icon = getDynamicIcon((badge as any).icon_name);
        
        return (
          <Card key={badge.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-full"
                  style={{ backgroundColor: (badge as any).color + '20' }}
                >
                  <Icon 
                    className="h-6 w-6" 
                    style={{ color: (badge as any).color }}
                  />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{(badge as any).name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {(badge as any).badge_type}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      +{(badge as any).coins_reward} coins
                    </Badge>
                  </div>
                </div>
              </div>
              {(badge as any).description && (
                <CardDescription>
                  {(badge as any).description}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Details */}
              <div className="space-y-2 text-sm text-muted-foreground">
                {badge.life_area && (
                  <div>
                    <span className="font-medium">Área da vida:</span> {badge.life_area}
                  </div>
                )}
                <div>
                  <span className="font-medium">Recompensa:</span> {badge.coins_reward} moedas
                </div>
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  <Badge variant={badge.is_active ? 'default' : 'secondary'} className="text-xs">
                    {badge.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};