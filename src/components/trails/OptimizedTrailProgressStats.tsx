import { TrendingUp, Target, Award, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrailsStats } from '@/hooks/useTrailsDashboardData';

interface OptimizedTrailProgressStatsProps {
  stats: TrailsStats;
  isLoading: boolean;
}

export const OptimizedTrailProgressStats = ({ stats, isLoading }: OptimizedTrailProgressStatsProps) => {
  const statsConfig = [
    {
      title: 'Trilhas Ativas',
      value: stats.activeTrails,
      icon: Zap,
      description: 'Em andamento',
    },
    {
      title: 'Trilhas Concluídas',
      value: stats.completedTrails,
      icon: Target,
      description: 'Finalizadas',
    },
    {
      title: 'Selos Conquistados',
      value: stats.totalBadges,
      icon: Award,
      description: 'Total de conquistas',
    },
    {
      title: 'Progresso Médio',
      value: `${stats.averageProgress}%`,
      icon: TrendingUp,
      description: 'Todas as trilhas',
    },
  ];

  if (isLoading) {
    return (
      <>
        {statsConfig.map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  return (
    <>
      {statsConfig.map((stat) => {
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
};