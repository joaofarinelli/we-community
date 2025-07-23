import { SetupCard } from '@/components/dashboard/SetupCard';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export const Dashboard = () => {
  const { user } = useAuth();
  const userName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Usuário';

  return (
    <DashboardLayout>
      <div className="max-w-4xl p-8">
        <div className="space-y-8">
          {/* Welcome Title */}
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Boas-vindas à plataforma, {userName}!
            </h1>
          </div>

          {/* Setup Checklist Card */}
          <SetupCard />
        </div>
      </div>
    </DashboardLayout>
  );
};