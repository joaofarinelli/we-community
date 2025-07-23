import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SetupChecklist } from '@/components/dashboard/SetupChecklist';

export const SetupPage = () => {
  return (
    <DashboardLayout>
      <div className="max-w-4xl p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Primeiros Passos</h1>
          <p className="text-muted-foreground mt-2">
            Configure sua comunidade seguindo estas etapas essenciais
          </p>
        </div>
        
        <SetupChecklist />
      </div>
    </DashboardLayout>
  );
};