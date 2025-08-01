import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TrailsDashboard } from '@/components/trails/TrailsDashboard';
import { PageBanner } from '@/components/ui/page-banner';

export const TrailsPage = () => {
  return (
    <DashboardLayout>
      <PageBanner bannerType="trails" />
      
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Trilhas</h1>
          <p className="text-muted-foreground">
            Acompanhe seu progresso nas jornadas de desenvolvimento pessoal
          </p>
        </div>

        <TrailsDashboard />
      </div>
    </DashboardLayout>
  );
};