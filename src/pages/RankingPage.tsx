import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RankingTab } from '@/components/gamification/RankingTab';
import { PageBanner } from '@/components/ui/page-banner';
import { StreakDialog } from '@/components/gamification/StreakDialog';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { useCoinName } from '@/hooks/useCoinName';
import { useCompanyStreakLeaderboard } from '@/hooks/useUserStreak';

export const RankingPage = () => {
  const { data: coinName = 'WomanCoins' } = useCoinName();
  const { data: streakLeaderboard } = useCompanyStreakLeaderboard(10);

  return (
    <DashboardLayout>
      <div className="max-w-6xl p-8">
        <div className="space-y-6">
          <PageBanner bannerType="ranking" />
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Ranking {coinName}
            </h1>
            <p className="text-muted-foreground">
              Acompanhe os níveis e {coinName} dos usuários mais ativos da sua empresa
            </p>
            <div className="flex items-center gap-4">
              <StreakDialog>
                <div className="cursor-pointer">
                  <StreakBadge variant="detailed" />
                </div>
              </StreakDialog>
            </div>
          </div>

          <RankingTab />
        </div>
      </div>
    </DashboardLayout>
  );
};