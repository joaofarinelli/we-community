import React from 'react';
import { TrendingUp, Target, Award, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TrailProgressStatsProps {
  trails?: any[];
  badges?: any[];
  isLoading?: boolean;
}

export const TrailProgressStats = React.memo(({ trails, badges, isLoading }: TrailProgressStatsProps) => {

  const activeTrails = trails?.filter(trail => trail.status === 'active').length || 0;
  const completedTrails = trails?.filter(trail => trail.status === 'completed').length || 0;
  const totalBadges = badges?.length || 0;
  
  const averageProgress = trails && trails.length > 0
    ? Math.round(trails.reduce((sum, trail) => sum + trail.progress_percentage, 0) / trails.length)
    : 0;

  const stats = [
    {
      title: 'Trilhas Ativas',
      value: activeTrails,
      icon: Zap,
      description: 'Em andamento',
    },
    {
      title: 'Trilhas Concluídas',
      value: completedTrails,
      icon: Target,
      description: 'Finalizadas',
    },
    {
      title: 'Selos Conquistados',
      value: totalBadges,
      icon: Award,
      description: 'Total de conquistas',
    },
    {
      title: 'Progresso Médio',
      value: `${averageProgress}%`,
      icon: TrendingUp,
      description: 'Todas as trilhas',
    },
  ];

  if (isLoading) {
    return (
      <>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-3 rounded-full" />
              </div>
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-2 w-16" />
            </div>
          </Card>
        ))}
      </>
    );
  }

  return (
    <>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
});