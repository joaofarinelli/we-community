import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RankingTab } from '@/components/gamification/RankingTab';
import { StreakDialog } from '@/components/gamification/StreakDialog';
import { LastPlacedSidebar } from '@/components/gamification/LastPlacedSidebar';
import { useCoinName } from '@/hooks/useCoinName';
import { useCompany } from '@/hooks/useCompany';
import { useCompanyStreakLeaderboard } from '@/hooks/useUserStreak';
import { useLastPlacedUsers } from '@/hooks/useLastPlacedUsers';
import { PageBanner } from '@/components/ui/page-banner';

export const RankingPage = () => {
  const { data: coinName = 'WomanCoins' } = useCoinName();
  const { data: company } = useCompany();
  const { data: streakLeaderboard } = useCompanyStreakLeaderboard(10);
  const { data: lastPlacedUsers } = useLastPlacedUsers();
  
  const hasHistoricalData = lastPlacedUsers && lastPlacedUsers.length > 0;

  return (
    <DashboardLayout>
      {/* Banner - sem padding para ocupar largura total */}
      <PageBanner bannerType="ranking" />
      
      <div className="max-w-7xl mx-auto p-8">
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

          <div className={hasHistoricalData ? "grid grid-cols-1 lg:grid-cols-4 gap-6" : "flex justify-center"}>
            <div className={hasHistoricalData ? "lg:col-span-3" : "w-full max-w-4xl"}>
              <RankingTab />
            </div>
            {hasHistoricalData && (
              <div className="lg:col-span-1">
                <LastPlacedSidebar />
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};