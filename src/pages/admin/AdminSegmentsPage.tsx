import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useSegments } from '@/hooks/useSegments';
import { CreateSegmentDialog } from '@/components/admin/segments/CreateSegmentDialog';
import { SegmentCard } from '@/components/admin/segments/SegmentCard';
import { TableSkeleton } from '@/components/ui/table-skeleton';

export const AdminSegmentsPage = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: segments, isLoading } = useSegments();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Segmentos</h1>
            <p className="text-muted-foreground">
              Crie segmentos para agrupar e organizar sua audiência
            </p>
          </div>
          
          {segments && segments.length > 0 && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo segmento
            </Button>
          )}
        </div>

        {isLoading ? (
          <TableSkeleton rows={3} columns={1} />
        ) : !segments || segments.length === 0 ? (
          <Card>
            <CardHeader className="text-center py-12">
              <CardTitle className="text-xl text-foreground">Nenhum segmento criado ainda</CardTitle>
              <CardDescription className="max-w-md mx-auto">
                Segmente sua audiência com base em características, comportamentos ou interesses para criar experiências mais personalizadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-12">
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar segmento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {segments.map((segment) => (
              <SegmentCard 
                key={segment.id} 
                segment={segment}
              />
            ))}
          </div>
        )}

        <CreateSegmentDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </div>
    </AdminLayout>
  );
};