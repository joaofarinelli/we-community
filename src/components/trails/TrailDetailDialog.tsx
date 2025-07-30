import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, MapPin, PlayCircle, CheckCircle, PauseCircle, Award, Target } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trail } from '@/hooks/useTrails';
import { useTrailStages } from '@/hooks/useTrailStages';
import { useTrailProgress } from '@/hooks/useTrailProgress';

interface TrailDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trail: Trail | null;
  onContinue?: () => void;
}

export const TrailDetailDialog = ({ open, onOpenChange, trail, onContinue }: TrailDetailDialogProps) => {
  const { data: stages } = useTrailStages(trail?.id);
  const { data: progress } = useTrailProgress(trail?.id);

  if (!trail) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <PlayCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'paused':
        return <PauseCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'paused':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'completed':
        return 'Concluída';
      case 'paused':
        return 'Pausada';
      default:
        return status;
    }
  };

  const completedStages = progress?.filter(p => p.is_completed).length || 0;
  const totalStages = stages?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {trail.name}
          </DialogTitle>
          <DialogDescription>
            Detalhes completos da sua trilha de desenvolvimento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Progress */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Status da Trilha</CardTitle>
                <Badge variant={getStatusVariant(trail.status)}>
                  {getStatusIcon(trail.status)}
                  <span className="ml-1">{getStatusLabel(trail.status)}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progresso Geral</span>
                  <span className="font-medium">{trail.progress_percentage}%</span>
                </div>
                <Progress value={trail.progress_percentage} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {completedStages} de {totalStages} etapas concluídas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Trail Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações da Trilha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trail.description && (
                <div>
                  <span className="font-medium text-sm">Descrição:</span>
                  <p className="text-foreground mt-1">{trail.description}</p>
                </div>
              )}
              
              {trail.life_area && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Área da vida:</span>
                  <Badge variant="secondary">{trail.life_area}</Badge>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Iniciada em {format(new Date(trail.started_at), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
              
              {trail.completed_at && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">
                    Concluída em {format(new Date(trail.completed_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stages and Progress */}
          <Tabs defaultValue="stages" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stages">Etapas</TabsTrigger>
              <TabsTrigger value="achievements">Conquistas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stages" className="space-y-4">
              {stages && stages.length > 0 ? (
                <div className="space-y-3">
                  {stages.map((stage, index) => {
                    const stageProgress = progress?.find(p => p.stage_id === stage.id);
                    const isCompleted = stageProgress?.is_completed || false;
                    
                    return (
                      <Card key={stage.id} className={isCompleted ? 'border-green-200 bg-green-50/50' : undefined}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                isCompleted 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                              </div>
                              <div>
                                <h4 className="font-medium">{stage.name}</h4>
                                {stage.description && (
                                  <p className="text-sm text-muted-foreground">{stage.description}</p>
                                )}
                              </div>
                            </div>
                            {isCompleted && (
                              <Badge variant="secondary" className="text-green-700 bg-green-100">
                                Concluída
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhuma etapa configurada ainda.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="achievements" className="space-y-4">
              <Card>
                <CardContent className="py-8 text-center">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Suas conquistas aparecerão aqui conforme você avança na trilha.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Fechar
            </Button>
            {trail.status === 'active' && onContinue && (
              <Button
                onClick={() => {
                  onContinue();
                  onOpenChange(false);
                }}
                className="flex-1"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Continuar Trilha
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};