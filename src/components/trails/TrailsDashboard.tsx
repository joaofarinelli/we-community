import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrailCard } from './TrailCard';
import { TrailProgressStats } from './TrailProgressStats';
import { TrailBadgesDisplay } from './TrailBadgesDisplay';
import { AvailableTrailsSection } from './AvailableTrailsSection';
import { useUserTrailParticipations } from '@/hooks/useTrails';
import { useUserTrailBadges } from '@/hooks/useTrailProgress';

export const TrailsDashboard = () => {
  const { data: trails, isLoading } = useUserTrailParticipations();
  const { data: badges } = useUserTrailBadges();

  const activeTrails = trails?.filter(trail => trail.status === 'active') || [];
  const completedTrails = trails?.filter(trail => trail.status === 'completed') || [];

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-2 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TrailProgressStats />
      </div>

      {/* Badges Section */}
      <TrailBadgesDisplay badges={badges || []} />

      {/* Trails Section */}
      <Tabs defaultValue="available" className="space-y-6">
        <TabsList>
          <TabsTrigger value="available">Trilhas Disponíveis</TabsTrigger>
          <TabsTrigger value="active">Minhas Trilhas Ativas ({activeTrails.length})</TabsTrigger>
          <TabsTrigger value="completed">Concluídas ({completedTrails.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <AvailableTrailsSection />
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