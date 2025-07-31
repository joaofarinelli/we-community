import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Award } from 'lucide-react';
import { TrailBadgeDialog } from '@/components/admin/trails/TrailBadgeDialog';
import { TrailBadgeCard } from '@/components/admin/trails/TrailBadgeCard';
import { useTrailBadges, useUpdateTrailBadge, useDeleteTrailBadge, TrailBadge } from '@/hooks/useTrailBadges';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AdminTrailBadgesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<TrailBadge | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [badgeToDelete, setBadgeToDelete] = useState<TrailBadge | null>(null);

  const { data: badges = [], isLoading } = useTrailBadges();
  const updateBadge = useUpdateTrailBadge();
  const deleteBadge = useDeleteTrailBadge();

  const handleCreateBadge = () => {
    setEditingBadge(null);
    setDialogOpen(true);
  };

  const handleEditBadge = (badge: TrailBadge) => {
    setEditingBadge(badge);
    setDialogOpen(true);
  };

  const handleDeleteBadge = (badge: TrailBadge) => {
    setBadgeToDelete(badge);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (badgeToDelete) {
      await deleteBadge.mutateAsync(badgeToDelete.id);
      setDeleteDialogOpen(false);
      setBadgeToDelete(null);
    }
  };

  const handleToggleActive = async (badge: TrailBadge) => {
    await updateBadge.mutateAsync({
      id: badge.id,
      is_active: !badge.is_active,
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Selos de Trilhas</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Selos de Trilhas</h1>
          </div>
          <Button onClick={handleCreateBadge}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Selo
          </Button>
        </div>

        {badges.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum selo criado</h3>
              <p className="text-muted-foreground mb-4">
                Crie selos para recompensar os usuários ao completarem trilhas.
              </p>
              <Button onClick={handleCreateBadge}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Selo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {badges.map((badge) => (
              <TrailBadgeCard
                key={badge.id}
                badge={badge}
                onEdit={handleEditBadge}
                onDelete={handleDeleteBadge}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}

        <TrailBadgeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          badge={editingBadge}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o selo "{badgeToDelete?.name}"? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}