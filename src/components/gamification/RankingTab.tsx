import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp, Users } from 'lucide-react';
import { useCompanyRanking, useUserRankingPosition } from '@/hooks/useCompanyRanking';
import { useAuth } from '@/hooks/useAuth';
import { RankingCard } from './RankingCard';
import { Skeleton } from '@/components/ui/skeleton';

export const RankingTab = () => {
  const { user } = useAuth();
  const { data: ranking, isLoading: rankingLoading } = useCompanyRanking(10);
  const { data: userPosition, isLoading: positionLoading } = useUserRankingPosition();

  if (rankingLoading || positionLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-8 rounded-full mb-2" />
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-6 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Seus Pontos</p>
                <p className="text-2xl font-bold">
                  {userPosition?.points || 0}
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
      </div>

      {/* Ranking List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Ranking da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ranking && ranking.length > 0 ? (
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
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum usuário com pontos ainda.</p>
              <p className="text-sm">Seja o primeiro a participar!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};