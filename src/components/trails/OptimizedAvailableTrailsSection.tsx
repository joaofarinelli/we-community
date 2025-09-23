import { useState, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAvailableTrailsData } from '@/hooks/useTrailsDashboardData';
import { useJoinTrail } from '@/hooks/useTrails';
import { TrailCard } from './TrailCard';
import { TrailTemplateDetailsDialog } from './TrailTemplateDetailsDialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface JoinTrailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trail: any;
}

const JoinTrailDialog = ({ open, onOpenChange, trail }: JoinTrailDialogProps) => {
  const joinTrail = useJoinTrail();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (!trail) return;
    
    setIsJoining(true);
    try {
      await joinTrail.mutateAsync({
        template_id: trail.id,
        name: trail.name,
        description: trail.description,
        life_area: trail.life_area,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error joining trail:', error);
    } finally {
      setIsJoining(false);
    }
  };

  if (!trail) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Iniciar Trilha</DialogTitle>
          <DialogDescription>
            Você está prestes a iniciar sua jornada nesta trilha.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                {trail.name}
              </CardTitle>
              {trail.description && (
                <CardDescription>{trail.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {trail.life_area && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Área da vida:</span>
                  <Badge variant="secondary">{trail.life_area}</Badge>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Criada em {format(new Date(trail.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Ao iniciar esta trilha, você poderá acompanhar seu progresso, completar etapas e conquistar selos conforme avança em sua jornada de desenvolvimento.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isJoining}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleJoin}
              disabled={isJoining}
              className="flex-1"
            >
              {isJoining ? 'Iniciando...' : 'Iniciar Trilha'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const OptimizedAvailableTrailsSection = () => {
  const { data, isLoading } = useAvailableTrailsData();
  const [selectedTrail, setSelectedTrail] = useState<any>(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const allAvailableTrails = useMemo(() => {
    if (!data) return [];
    
    return [
      ...data.templates.map(template => ({
        ...template,
        type: 'template' as const,
      })),
      ...data.userTrails.map(trail => ({
        ...trail,
        type: 'trail' as const,
      })),
    ];
  }, [data]);

  const handleStartTrail = (trail: any) => {
    setSelectedTrail(trail);
    setJoinDialogOpen(true);
  };

  const handleViewDetails = (trail: any) => {
    setSelectedTrail(trail);
    setDetailsDialogOpen(true);
  };

  const handleStartFromDetails = (template: any) => {
    setSelectedTrail(template);
    setDetailsDialogOpen(false);
    setJoinDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (allAvailableTrails.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">
            Nenhuma trilha disponível no momento
          </p>
          <p className="text-sm text-muted-foreground">
            Entre em contato com o administrador para criar trilhas para você.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allAvailableTrails.map((trail) => (
          <TrailCard
            key={`${trail.type}-${trail.id}`}
            trail={trail}
            onViewDetails={handleViewDetails}
            onStartTrail={handleStartTrail}
          />
        ))}
      </div>

      <JoinTrailDialog
        open={joinDialogOpen}
        onOpenChange={setJoinDialogOpen}
        trail={selectedTrail}
      />

      {selectedTrail && (
        <TrailTemplateDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          trailTemplate={selectedTrail}
          onStartTrail={handleStartFromDetails}
        />
      )}
    </>
  );
};