import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminTrailsManagement } from '@/components/admin/AdminTrailsManagement';

export const AdminTrailsPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Trilhas</h1>
          <p className="text-muted-foreground">
            Gerencie trilhas, templates e acompanhe o progresso das usuárias
          </p>
        </div>

        <AdminTrailsManagement />
      </div>
    </AdminLayout>
  );
};