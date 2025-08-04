import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RankingTab } from '@/components/gamification/RankingTab';
import { StreakDialog } from '@/components/gamification/StreakDialog';
import { useCoinName } from '@/hooks/useCoinName';
import { useCompany } from '@/hooks/useCompany';
import { useCompanyStreakLeaderboard } from '@/hooks/useUserStreak';
import { PageBanner } from '@/components/ui/page-banner';

export const RankingPage = () => {
  const { data: coinName = 'WomanCoins' } = useCoinName();
  const { data: company } = useCompany();
  const { data: streakLeaderboard } = useCompanyStreakLeaderboard(10);

  return (
    <DashboardLayout>
      {/* Banner - sem padding para ocupar largura total */}
      <PageBanner bannerType="ranking" />
      
      <div className="max-w-6xl mx-auto p-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Ranking <span style={{ color: company?.primary_color || '#334155' }}>{company?.name || 'Empresa'}</span>
            </h1>
            <p className="text-muted-foreground">
              Acompanhe os níveis e {coinName} dos usuários mais ativos da sua empresa
            </p>
            <div className="flex items-center gap-4">
              <StreakDialog>
                <div className="cursor-pointer" />
              </StreakDialog>
            </div>
          </div>

          <RankingTab />
        </div>
      </div>
    </DashboardLayout>
  );
};