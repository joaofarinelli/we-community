import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RankingTab } from '@/components/gamification/RankingTab';

export const RankingPage = () => {
  return (
    <DashboardLayout>
      <div className="max-w-6xl p-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Ranking WomanCoins
            </h1>
            <p className="text-muted-foreground">
              Acompanhe os níveis e WomanCoins dos usuários mais ativos da sua empresa
            </p>
          </div>

          <RankingTab />
        </div>
      </div>
    </DashboardLayout>
  );
};