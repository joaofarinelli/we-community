import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const AdminAccessGroupsPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Grupos de Acesso</h1>
          <p className="text-muted-foreground">
            Configure grupos de acesso para diferentes níveis de permissão
          </p>
        </div>

        <Card>
          <CardHeader className="text-center py-12">
            <CardTitle className="text-xl text-foreground">Nenhum grupo criado ainda</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Crie grupos de acesso para organizar permissões e controlar o que diferentes tipos de usuários podem ver e fazer.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-12">
            <Button>
              Criar grupo de acesso
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};