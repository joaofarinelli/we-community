import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useChallengeProgress, useChallengeRewards } from '@/hooks/useChallenges';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Trophy, 
  Target, 
  CheckCircle, 
  Clock,
  Coins
} from 'lucide-react';

interface UserChallengesPerformanceProps {
  userId: string;
}

export const UserChallengesPerformance = ({ userId }: UserChallengesPerformanceProps) => {
  const { data: challengeProgress, isLoading: progressLoading } = useChallengeProgress(userId);
  const { data: challengeRewards, isLoading: rewardsLoading } = useChallengeRewards();

  // Calculate statistics
  const totalChallenges = challengeProgress?.length || 0;
  const completedChallenges = challengeProgress?.filter(cp => cp.is_completed)?.length || 0;
  const inProgressChallenges = challengeProgress?.filter(cp => !cp.is_completed && cp.progress_value > 0)?.length || 0;
  const completionRate = totalChallenges > 0 ? Math.round((completedChallenges / totalChallenges) * 100) : 0;
  const totalRewards = challengeRewards?.length || 0;

  if (progressLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Desempenho nos Desafios
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

  if (!challengeProgress || challengeProgress.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Desempenho nos Desafios
          </CardTitle>
          <CardDescription>
            Acompanhe o desempenho do usuário nos desafios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Este usuário ainda não participou de nenhum desafio
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Desempenho nos Desafios
        </CardTitle>
        <CardDescription>
          Estatísticas e progresso do usuário nos desafios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalChallenges}</div>
            <p className="text-sm text-muted-foreground">Total de Desafios</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedChallenges}</div>
            <p className="text-sm text-muted-foreground">Concluídos</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{inProgressChallenges}</div>
            <p className="text-sm text-muted-foreground">Em Andamento</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{completionRate}%</div>
            <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
          </div>
        </div>

        {/* Challenge Progress List */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Progresso dos Desafios
          </h4>
          
          {challengeProgress.slice(0, 5).map((progress) => {
            const challenge = (progress as any).challenges;
            const progressPercentage = progress.target_value > 0 
              ? Math.round((progress.progress_value / progress.target_value) * 100) 
              : 0;

            return (
              <div key={progress.id} className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium">{challenge?.title || 'Desafio'}</h5>
                  <div className="flex items-center gap-2">
                    {progress.is_completed && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Concluído
                      </Badge>
                    )}
                    {!progress.is_completed && progress.progress_value > 0 && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        <Clock className="h-3 w-3 mr-1" />
                        Em Andamento
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progresso: {progressPercentage}%</span>
                    <span>{progress.progress_value}/{progress.target_value}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                {progress.completed_at && (
                  <p className="text-xs text-muted-foreground">
                    Concluído em {format(new Date(progress.completed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                )}
              </div>
            );
          })}

          {challengeProgress.length > 5 && (
            <p className="text-sm text-muted-foreground text-center">
              E mais {challengeProgress.length - 5} desafios...
            </p>
          )}
        </div>

        {/* Rewards Summary */}
        {totalRewards > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-4 w-4 text-yellow-600" />
              <span className="font-medium">Recompensas Obtidas</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Total de {totalRewards} recompensa{totalRewards !== 1 ? 's' : ''} conquistada{totalRewards !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};