import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrailCard } from './TrailCard';
import { OptimizedTrailProgressStats } from './OptimizedTrailProgressStats';
import { OptimizedTrailBadgesDisplay } from './OptimizedTrailBadgesDisplay';
import { OptimizedAvailableTrailsSection } from './OptimizedAvailableTrailsSection';
import { useTrailsDashboardData } from '@/hooks/useTrailsDashboardData';

export const TrailsDashboard = () => {
  const { trails, badges, stats, isLoading, isTrailsLoading, isBadgesLoading } = useTrailsDashboardData();

  const activeTrails = trails.filter(trail => trail.status === 'active');
  const completedTrails = trails.filter(trail => trail.status === 'completed');

  // Progressive loading - don't show full skeleton if any data is available
  const showFullSkeleton = isLoading && trails.length === 0 && badges.length === 0;

  if (showFullSkeleton) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <OptimizedTrailProgressStats stats={stats} isLoading={true} />
        </div>
        
        {/* Badges Skeleton */}
        <OptimizedTrailBadgesDisplay badges={[]} isLoading={true} />
        
        {/* Trails Skeleton */}
        <Tabs defaultValue="available" className="space-y-6">
          <TabsList>
            <TabsTrigger value="available">Explorar Trilhas</TabsTrigger>
            <TabsTrigger value="active">Trilhas Ativas</TabsTrigger>
            <TabsTrigger value="completed">Concluídas</TabsTrigger>
          </TabsList>
          <TabsContent value="available">
            <OptimizedAvailableTrailsSection />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards - progressive loading */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <OptimizedTrailProgressStats stats={stats} isLoading={isTrailsLoading} />
      </div>

      {/* Badges Section - progressive loading */}
      <OptimizedTrailBadgesDisplay badges={badges} isLoading={isBadgesLoading} />

      {/* Trails Section */}
      <Tabs defaultValue="available" className="space-y-6">
        <TabsList>
          <TabsTrigger value="available">Explorar Trilhas</TabsTrigger>
          <TabsTrigger value="active">Trilhas Ativas ({activeTrails.length})</TabsTrigger>
          <TabsTrigger value="completed">Concluídas ({completedTrails.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <OptimizedAvailableTrailsSection />
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeTrails.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeTrails.map((trail) => (
                <TrailCard key={trail.id} trail={trail} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Você ainda não iniciou nenhuma trilha.
                </p>
                <p className="text-sm text-muted-foreground">
                  Explore as trilhas disponíveis na primeira aba para começar sua jornada.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedTrails.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedTrails.map((trail) => (
                <TrailCard key={trail.id} trail={trail} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  Nenhuma trilha concluída ainda.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};