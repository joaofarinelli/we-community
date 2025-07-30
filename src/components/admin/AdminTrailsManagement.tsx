import { useState } from 'react';
import { Plus, Users, File, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrailTemplatesTab } from './trails/TrailTemplatesTab';
import { UserTrailsTab } from './trails/UserTrailsTab';
import { TrailBadgesTab } from './trails/TrailBadgesTab';
import { CreateTrailTemplateDialog } from './trails/CreateTrailTemplateDialog';
import { useAllTrails } from '@/hooks/useTrails';
import { useTrailTemplates } from '@/hooks/useTrailTemplates';
import { useTrailBadges } from '@/hooks/useTrailProgress';

export const AdminTrailsManagement = () => {
  const [showCreateTemplateDialog, setShowCreateTemplateDialog] = useState(false);
  const { data: trails } = useAllTrails();
  const { data: templates } = useTrailTemplates();
  const { data: badges } = useTrailBadges();

  const activeTrails = trails?.filter(trail => trail.status === 'active').length || 0;
  const completedTrails = trails?.filter(trail => trail.status === 'completed').length || 0;

  const stats = [
    {
      title: 'Trilhas Ativas',
      value: activeTrails,
      icon: Users,
      description: 'Usuárias em jornadas ativas',
    },
    {
      title: 'Trilhas Concluídas',
      value: completedTrails,
      icon: Award,
      description: 'Jornadas finalizadas',
    },
    {
      title: 'Templates',
      value: templates?.length || 0,
      icon: File,
      description: 'Templates disponíveis',
    },
    {
      title: 'Selos',
      value: badges?.length || 0,
      icon: Award,
      description: 'Selos configurados',
    },
  ];

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
      <Tabs defaultValue="templates" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="trails">Trilhas das Usuárias</TabsTrigger>
            <TabsTrigger value="badges">Selos</TabsTrigger>
          </TabsList>

          <Button onClick={() => setShowCreateTemplateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>

        <TabsContent value="templates">
          <TrailTemplatesTab />
        </TabsContent>

        <TabsContent value="trails">
          <UserTrailsTab />
        </TabsContent>

        <TabsContent value="badges">
          <TrailBadgesTab />
        </TabsContent>
      </Tabs>

      <CreateTrailTemplateDialog 
        open={showCreateTemplateDialog} 
        onOpenChange={setShowCreateTemplateDialog} 
      />
    </div>
  );
};