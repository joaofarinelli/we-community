import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, PlayCircle, CheckCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTrails } from '@/hooks/useTrails';
import { useTrailStages } from '@/hooks/useTrailStages';
import { useTrailProgress } from '@/hooks/useTrailProgress';
import { StageDetailsDialog, TrailStage } from '@/components/trails/StageDetailsDialog';

export const TrailStagesPage = () => {
  const { trailId } = useParams<{ trailId: string }>();
  const navigate = useNavigate();
  const [selectedStage, setSelectedStage] = useState<TrailStage | null>(null);
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  
  const { data: trails } = useTrails();
  const { data: stages } = useTrailStages(trailId);
  const { data: progress, refetch: refetchProgress } = useTrailProgress(trailId);

  const handleStageClick = (stage: TrailStage) => {
    setSelectedStage(stage);
    setIsStageDialogOpen(true);
  };

  const handleStageComplete = () => {
    refetchProgress();
  };
  
  const trail = trails?.find(t => t.id === trailId);
  
  if (!trail) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/trails')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Trilha não encontrada.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const completedStages = progress?.filter(p => p.is_completed).length || 0;
  const totalStages = stages?.length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/trails')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Trail Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-2xl">{trail.name}</CardTitle>
                  {trail.description && (
                    <CardDescription className="mt-1">{trail.description}</CardDescription>
                  )}
                </div>
              </div>
              <Badge variant={trail.status === 'active' ? 'default' : 'secondary'}>
                {trail.status === 'active' ? (
                  <>
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Ativa
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Concluída
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
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

        {/* Stages */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Etapas da Trilha</h2>
          
          {stages && stages.length > 0 ? (
            <div className="space-y-4">
              {stages.map((stage, index) => {
                const stageProgress = progress?.find(p => p.stage_id === stage.id);
                const isCompleted = stageProgress?.is_completed || false;
                const isNext = !isCompleted && index === completedStages;
                
                return (
                  <Card 
                    key={stage.id} 
                    className={`${
                      isCompleted 
                        ? 'border-green-200 bg-green-50/50' 
                        : isNext 
                        ? 'border-primary/20 bg-primary/5' 
                        : 'opacity-60'
                    } ${isNext ? 'ring-2 ring-primary/20' : ''}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                            isCompleted 
                              ? 'bg-green-500 text-white' 
                              : isNext
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {isCompleted ? <CheckCircle className="h-6 w-6" /> : index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold">{stage.name}</h3>
                            {stage.description && (
                              <p className="text-muted-foreground mt-1">{stage.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          {isCompleted && (
                            <Badge variant="secondary" className="text-green-700 bg-green-100">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Concluída
                            </Badge>
                          )}
                          {isNext && (
                            <Badge variant="default">
                              Próxima etapa
                            </Badge>
                          )}
                          {isNext && (
                            <Button 
                              size="sm" 
                              onClick={() => handleStageClick(stage)}
                            >
                              Iniciar Etapa
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma etapa configurada</h3>
                <p className="text-muted-foreground">
                  Esta trilha ainda não possui etapas definidas. Entre em contato com o administrador.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stage Details Dialog */}
        <StageDetailsDialog
          open={isStageDialogOpen}
          onOpenChange={setIsStageDialogOpen}
          stage={selectedStage}
          trailId={trailId || ''}
          isCompleted={selectedStage ? progress?.find(p => p.stage_id === selectedStage.id)?.is_completed || false : false}
          onStageComplete={handleStageComplete}
        />
      </div>
    </DashboardLayout>
  );
};