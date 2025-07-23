import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const AdminSegmentsPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Segmentos</h1>
          <p className="text-muted-foreground">
            Crie segmentos para agrupar e organizar sua audiência
          </p>
        </div>

        <Card>
          <CardHeader className="text-center py-12">
            <CardTitle className="text-xl text-foreground">Nenhum segmento criado ainda</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Segmente sua audiência com base em características, comportamentos ou interesses para criar experiências mais personalizadas.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-12">
            <Button>
              Criar segmento
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};