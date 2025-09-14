import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrailProgress } from '@/hooks/useTrailProgress';
import { useFilteredTrails } from '@/hooks/useFilteredTrails';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  MapPin, 
  CheckCircle, 
  Clock,
  Play,
  Target
} from 'lucide-react';

interface UserTrailsPerformanceProps {
  userId: string;
}

export const UserTrailsPerformance = ({ userId }: UserTrailsPerformanceProps) => {
  const { data: trailProgress, isLoading: progressLoading } = useTrailProgress(undefined, userId);
  const { data: allTrails } = useFilteredTrails();

  if (progressLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Desempenho nas Trilhas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group progress by trail_id to get unique trails
  const trailProgressMap = new Map();
  trailProgress?.forEach(progress => {
    const trailId = progress.trail_id;
    if (!trailProgressMap.has(trailId)) {
      trailProgressMap.set(trailId, []);
    }
    trailProgressMap.get(trailId)!.push(progress);
  });

  const uniqueTrailsData = Array.from(trailProgressMap.keys()).map((trailId: string) => {
    const stages = trailProgressMap.get(trailId)!;
    const completedStages = stages.filter((s: any) => s.is_completed).length;
    const totalStages = stages.length;
    const progressPercentage = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
    const isCompleted = completedStages === totalStages && totalStages > 0;
    
    // Get trail info from allTrails if available
    const trailInfo = allTrails?.find(t => t.id === trailId);
    
    return {
      trailId,
      name: trailInfo?.name || `Trilha ${trailId.slice(0, 8)}`,
      completedStages,
      totalStages,
      progressPercentage,
      isCompleted,
      stages,
      lastActivity: stages.reduce((latest: string | null, stage: any) => {
        if (stage.completed_at && (!latest || Date.parse(stage.completed_at) > Date.parse(latest))) {
          return stage.completed_at;
        }
        return latest;
      }, null),
      status: trailInfo?.status || 'active'
    };
  });

  const totalTrails = uniqueTrailsData.length;
  const completedTrails = uniqueTrailsData.filter(t => t.isCompleted).length;
  const activeTrails = uniqueTrailsData.filter(t => !t.isCompleted && t.completedStages > 0).length;
  const averageProgress = totalTrails > 0 
    ? Math.round(uniqueTrailsData.reduce((sum, trail) => sum + trail.progressPercentage, 0) / totalTrails)
    : 0;

  if (!trailProgress || trailProgress.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Desempenho nas Trilhas
          </CardTitle>
          <CardDescription>
            Acompanhe o progresso do usuário nas trilhas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Este usuário ainda não participou de nenhuma trilha
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Desempenho nas Trilhas
        </CardTitle>
        <CardDescription>
          Estatísticas e progresso do usuário nas trilhas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalTrails}</div>
            <p className="text-sm text-muted-foreground">Trilhas Iniciadas</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedTrails}</div>
            <p className="text-sm text-muted-foreground">Concluídas</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{activeTrails}</div>
            <p className="text-sm text-muted-foreground">Em Andamento</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{averageProgress}%</div>
            <p className="text-sm text-muted-foreground">Progresso Médio</p>
          </div>
        </div>

        {/* Trail Progress List */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Progresso das Trilhas
          </h4>
          
          {uniqueTrailsData.slice(0, 5).map((trail) => (
            <div key={trail.trailId} className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <h5 className="font-medium">{trail.name}</h5>
                <div className="flex items-center gap-2">
                  {trail.isCompleted && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Concluída
                    </Badge>
                  )}
                  {!trail.isCompleted && trail.completedStages > 0 && (
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      <Clock className="h-3 w-3 mr-1" />
                      Em Andamento
                    </Badge>
                  )}
                  {trail.completedStages === 0 && (
                    <Badge variant="outline" className="text-gray-600 border-gray-600">
                      <Play className="h-3 w-3 mr-1" />
                      Iniciada
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Progresso: {trail.progressPercentage}%</span>
                  <span>{trail.completedStages}/{trail.totalStages} etapas</span>
                </div>
                <Progress value={trail.progressPercentage} className="h-2" />
              </div>

              {trail.lastActivity && (
                <p className="text-xs text-muted-foreground">
                  Última atividade em {format(new Date(trail.lastActivity), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              )}
            </div>
          ))}

          {uniqueTrailsData.length > 5 && (
            <p className="text-sm text-muted-foreground text-center">
              E mais {uniqueTrailsData.length - 5} trilhas...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};