import { AdminLayout } from '@/components/admin/AdminLayout';

export const AdminContentPostsPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Publicações</h1>
          <p className="text-muted-foreground">
            Gerencie as publicações da sua comunidade
          </p>
        </div>
        
        <div className="border rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Em breve</h2>
          <p className="text-muted-foreground">
            A funcionalidade de gerenciamento de publicações estará disponível em breve.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};