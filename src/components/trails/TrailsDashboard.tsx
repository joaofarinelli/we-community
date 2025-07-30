import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrailCard } from './TrailCard';
import { TrailProgressStats } from './TrailProgressStats';
import { TrailBadgesDisplay } from './TrailBadgesDisplay';
import { CreateTrailDialog } from './CreateTrailDialog';
import { useTrails } from '@/hooks/useTrails';
import { useUserTrailBadges } from '@/hooks/useTrailProgress';

export const TrailsDashboard = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { data: trails, isLoading } = useTrails();
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Suas Trilhas</h2>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Trilha
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Ativas ({activeTrails.length})</TabsTrigger>
          <TabsTrigger value="completed">Concluídas ({completedTrails.length})</TabsTrigger>
        </TabsList>

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
                  Você ainda não possui trilhas ativas.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  Criar Primeira Trilha
                </Button>
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

      <CreateTrailDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
    </div>
  );
};