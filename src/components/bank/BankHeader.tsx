import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useUserCoins } from '@/hooks/useUserPoints';
import { useUserLevel } from '@/hooks/useUserLevel';
import { useAccountStats } from '@/hooks/useAccountStats';
import { useCoinName } from '@/hooks/useCoinName';
import { useCompany } from '@/hooks/useCompany';

export const BankHeader = () => {
  const { data: userCoins, isLoading: coinsLoading } = useUserCoins();
  const { data: userLevel, isLoading: levelLoading } = useUserLevel();
  const { data: stats, isLoading: statsLoading } = useAccountStats();
  const { data: coinName = 'WomanCoins' } = useCoinName();
  const { data: company } = useCompany();

  if (coinsLoading || levelLoading || statsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded-lg"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const balance = userCoins?.total_coins || 0;

  return (
    <div className="mb-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          <span style={{ color: company?.primary_color || '#334155' }}>{company?.name || 'Empresa'}</span> Bank
        </h1>
        <p className="text-muted-foreground">Gerencie suas moedas e faça transferências</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Saldo Principal */}
        <Card className="md:col-span-2 bg-gradient-to-br from-primary/10 to-secondary/10 border-none shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Saldo Atual</p>
                <div className="flex items-center gap-2">
                  <Coins className="h-8 w-8 text-primary" />
                  <span className="text-4xl font-bold">{balance.toLocaleString()}</span>
                </div>
                {userLevel?.user_levels && (
                  <Badge variant="secondary" className="mt-3">
                    {userLevel.user_levels.level_name}
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-600 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">+{stats?.totalEarned || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Rápidas */}
        <div className="space-y-4">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ArrowDownRight className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">Recebido</p>
                  <p className="text-lg font-bold text-green-700">
                    {stats?.transfersReceived.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ArrowUpRight className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Enviado</p>
                  <p className="text-lg font-bold text-blue-700">
                    {stats?.transfersSent.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};