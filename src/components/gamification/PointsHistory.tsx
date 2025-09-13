import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePointsHistory, getActionTypeLabel, getActionTypeIcon } from '@/hooks/usePointsHistory';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PointsHistoryProps {
  userId?: string;
  limit?: number;
}

export const PointsHistory = ({ userId, limit = 20 }: PointsHistoryProps) => {
  const { data: history, isLoading } = usePointsHistory(userId, limit);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Pontos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico de Pontos
        </CardTitle>
      </CardHeader>
      <CardContent>
            {(history as any) && (history as any).length > 0 ? (
              <div className="space-y-4">
                {(history as any).map((transaction: any) => (
              <div
                key={transaction.id}
                className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <span className="text-lg">
                    {getActionTypeIcon(transaction.action_type)}
                  </span>
                </div>
                
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {getActionTypeLabel(transaction.action_type)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(transaction.created_at), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </p>
                </div>
                
                <Badge variant={transaction.points > 0 ? "default" : "secondary"}>
                  +{transaction.points} pts
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma atividade ainda.</p>
            <p className="text-sm">Comece a interagir para ganhar pontos!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};