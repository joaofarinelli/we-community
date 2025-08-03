import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp, Users, Coins, Calendar, Clock } from 'lucide-react';
import { useCompanyRanking, useUserRankingPosition } from '@/hooks/useCompanyRanking';
import { useCurrentMonthProgress } from '@/hooks/useMonthlyRankings';
import { useAuth } from '@/hooks/useAuth';
import { useCoinName } from '@/hooks/useCoinName';
import { RankingCard } from './RankingCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export const RankingTab = () => {
  const { user } = useAuth();
  const { data: ranking, isLoading: rankingLoading } = useCompanyRanking(10);
  const { data: userPosition, isLoading: positionLoading } = useUserRankingPosition();
  const { data: monthProgress } = useCurrentMonthProgress();
  const { data: coinName = 'WomanCoins' } = useCoinName();

  const isStatsLoading = positionLoading;
  const isRankingListLoading = rankingLoading;

  return (
    <div className="space-y-6">
      {/* Monthly Progress Card */}
      {monthProgress && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Ciclo Mensal Atual</CardTitle>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {monthProgress.daysRemaining} dias restantes
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progresso do mês</span>
              <span>{Math.round(monthProgress.progressPercentage)}%</span>
            </div>
            <Progress value={monthProgress.progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Próximo reset: {monthProgress.nextReset.toLocaleDateString('pt-BR')}</span>
              <span>{monthProgress.daysPassed} de {monthProgress.totalDays} dias</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isStatsLoading ? (
          [1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-8 rounded-full mb-2" />
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-6 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Sua Posição</p>
                    <p className="text-2xl font-bold">
                      {userPosition?.rank ? `#${userPosition.rank}` : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Moedas do Mês</p>
                    <p className="text-2xl font-bold">
                      {userPosition?.monthlyCoins || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Usuários</p>
                    <p className="text-2xl font-bold">
                      {userPosition?.total_users || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Ranking List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Ranking {coinName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isRankingListLoading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))
          ) : ranking && ranking.length > 0 ? (
            ranking.map((rankedUser) => (
              <RankingCard
                key={rankedUser.user_id}
                rank={rankedUser.rank}
                user={rankedUser}
                isCurrentUser={rankedUser.user_id === user?.id}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum usuário com {coinName} ainda.</p>
              <p className="text-sm">Seja o primeiro a participar!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
