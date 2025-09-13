import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
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
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-3 w-32" />
              </div>
            </Card>
          ))}
        </div>
        
        {/* Trails Skeleton */}
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>
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