import { AdminLayout } from '@/components/admin/AdminLayout';
import { LevelManagement } from '@/components/admin/LevelManagement';

export const AdminLevelsPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gamificação</h1>
          <p className="text-muted-foreground">
            Configure os níveis e sistema de pontuação da sua comunidade
          </p>
        </div>

        <LevelManagement />
      </div>
    </AdminLayout>
  );
};