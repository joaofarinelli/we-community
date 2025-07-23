import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const AdminUsersPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audiência</h1>
          <p className="text-muted-foreground">
            Gerencie os membros da sua comunidade
          </p>
        </div>

        <Card>
          <CardHeader className="text-center py-12">
            <CardTitle className="text-xl text-foreground">Nenhuma audiência ainda</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Você ainda não adicionou nenhuma pessoa. Comece a construir sua audiência convidando membros para sua comunidade ou importando contatos.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-12">
            <Button>
              Adicionar audiência
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};