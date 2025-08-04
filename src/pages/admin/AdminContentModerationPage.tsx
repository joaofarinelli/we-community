import { AdminLayout } from '@/components/admin/AdminLayout';

export const AdminContentModerationPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Moderação</h1>
          <p className="text-muted-foreground">
            Gerencie a moderação de conteúdo
          </p>
        </div>
        
        <div className="border rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Em breve</h2>
          <p className="text-muted-foreground">
            A funcionalidade de moderação estará disponível em breve.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};