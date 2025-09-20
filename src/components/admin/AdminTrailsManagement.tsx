import { useState, useMemo } from 'react';
import { Plus, Users, File, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminTrailsTab } from './trails/AdminTrailsTab';
import { TrailParticipationsTab } from './trails/TrailParticipationsTab';
import { TrailBadgesTab } from './trails/TrailBadgesTab';
import { AdminCreateTrailDialog } from './trails/AdminCreateTrailDialog';
import { useAllTrails } from '@/hooks/useTrails';
import { useTrailTemplates } from '@/hooks/useTrailTemplates';
import { useTrailBadges } from '@/hooks/useTrailProgress';

export const AdminTrailsManagement = () => {
  const [showCreateAdminTrailDialog, setShowCreateAdminTrailDialog] = useState(false);
  const { data: trails } = useAllTrails();
  const { data: templates } = useTrailTemplates();
  const { data: badges } = useTrailBadges();

  const stats = useMemo(() => {
    const activeTrails = trails?.filter(trail => trail.status === 'active').length || 0;
    const completedTrails = trails?.filter(trail => trail.status === 'completed').length || 0;
    
    return [
      {
        title: 'Trilhas Criadas',
        value: templates?.length || 0,
        icon: File,
        description: 'Trilhas disponíveis para participação',
      },
      {
        title: 'Participações Ativas',
        value: activeTrails,
        icon: Users,
        description: 'Usuárias em trilhas ativas',
      },
      {
        title: 'Participações Concluídas',
        value: completedTrails,
        icon: Award,
        description: 'Participações finalizadas',
      },
      {
        title: 'Selos',
        value: badges?.length || 0,
        icon: Award,
        description: 'Selos configurados',
      },
    ];
  }, [trails, templates, badges]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="trails" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="trails">Trilhas</TabsTrigger>
            <TabsTrigger value="participations">Participações</TabsTrigger>
            <TabsTrigger value="badges">Selos</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button onClick={() => setShowCreateAdminTrailDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Trilha
            </Button>
          </div>
        </div>

        <TabsContent value="trails">
          <AdminTrailsTab />
        </TabsContent>

        <TabsContent value="participations">
          <TrailParticipationsTab />
        </TabsContent>

        <TabsContent value="badges">
          <TrailBadgesTab />
        </TabsContent>
      </Tabs>
      
      <AdminCreateTrailDialog 
        open={showCreateAdminTrailDialog} 
        onOpenChange={setShowCreateAdminTrailDialog} 
      />
    </div>
  );
};