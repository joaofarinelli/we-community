import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrailCard } from './TrailCard';
import { TrailProgressStats } from './TrailProgressStats';
import { TrailBadgesDisplay } from './TrailBadgesDisplay';
import { AvailableTrailsSection } from './AvailableTrailsSection';
import { TrailsCompactSkeleton } from './TrailsCompactSkeleton';
import { useTrailsDashboardData } from '@/hooks/useTrailsDashboardData';

export const TrailsDashboard = React.memo(() => {
  const { 
    userTrails, 
    badges, 
    isLoading, 
    isUserTrailsLoading,
    isBadgesLoading 
  } = useTrailsDashboardData();

  const { activeTrails, completedTrails } = useMemo(() => ({
    activeTrails: userTrails?.filter(trail => trail.status === 'active') || [],
    completedTrails: userTrails?.filter(trail => trail.status === 'completed') || []
  }), [userTrails]);

  // Show compact skeleton during initial load
  if (isLoading) {
    return <TrailsCompactSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TrailProgressStats 
          trails={userTrails} 
          badges={badges} 
          isLoading={isUserTrailsLoading || isBadgesLoading} 
        />
      </div>

      {/* Badges Section */}
      <TrailBadgesDisplay badges={badges || []} isLoading={isBadgesLoading} />

      {/* Trails Section */}
      <Tabs defaultValue="available" className="space-y-6">
        <TabsList>
          <TabsTrigger value="available">Trilhas Disponíveis</TabsTrigger>
          <TabsTrigger value="active">Minhas Trilhas Ativas ({activeTrails.length})</TabsTrigger>
          <TabsTrigger value="completed">Concluídas ({completedTrails.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <AvailableTrailsSection isFromDashboard />
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
});