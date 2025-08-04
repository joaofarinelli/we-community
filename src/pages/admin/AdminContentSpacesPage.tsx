import { AdminLayout } from '@/components/admin/AdminLayout';

export const AdminContentSpacesPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Espaços</h1>
          <p className="text-muted-foreground">
            Gerencie os espaços de conteúdo
          </p>
        </div>
        
        <div className="border rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Em breve</h2>
          <p className="text-muted-foreground">
            A funcionalidade de gerenciamento de espaços estará disponível em breve.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};