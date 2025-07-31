import { useState } from 'react';
import { Play, Award, MapPin, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAvailableTrails, useJoinTrail } from '@/hooks/useTrails';
import { useTrailTemplates } from '@/hooks/useTrailTemplates';
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

export const AvailableTrailsSection = () => {
  const { data: availableTrails, isLoading } = useAvailableTrails();
  const { data: templates } = useTrailTemplates();
  const [selectedTrail, setSelectedTrail] = useState<any>(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  const handleStartTrail = (trail: any) => {
    setSelectedTrail(trail);
    setJoinDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Combine templates and available trails
  const allAvailableTrails = [
    ...(templates || []).map(template => ({
      ...template,
      type: 'template' as const,
    })),
    ...(availableTrails || []).map(trail => ({
      ...trail,
      type: 'trail' as const,
    })),
  ];

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
          <Card key={`${trail.type}-${trail.id}`} className="hover:shadow-md transition-shadow">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{trail.name}</CardTitle>
                <Badge variant={trail.type === 'template' ? 'secondary' : 'default'}>
                  {trail.type === 'template' ? 'Template' : 'Trilha'}
                </Badge>
              </div>
              {trail.description && (
                <CardDescription className="line-clamp-2">
                  {trail.description}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Details */}
              <div className="space-y-2 text-sm text-muted-foreground">
                {trail.life_area && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{trail.life_area}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Criada em {format(new Date(trail.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                onClick={() => handleStartTrail(trail)}
                className="w-full"
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Trilha
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <JoinTrailDialog
        open={joinDialogOpen}
        onOpenChange={setJoinDialogOpen}
        trail={selectedTrail}
      />
    </>
  );
};