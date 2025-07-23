import { useState } from 'react';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CreateUserItemDialog } from '@/components/marketplace/CreateUserItemDialog';
import { useUserMarketplaceItems, useDeleteUserMarketplaceItem } from '@/hooks/useUserMarketplaceItems';

export default function MyItemsPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const { data: items = [], isLoading } = useUserMarketplaceItems();
  const deleteItem = useDeleteUserMarketplaceItem();

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowCreateDialog(true);
  };

  const handleDelete = async (itemId: string) => {
    await deleteItem.mutateAsync(itemId);
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditingItem(null);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meus Anúncios</h1>
            <p className="text-muted-foreground">
              Gerencie os itens que você está vendendo no marketplace
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Anunciar Item
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum item anunciado</h3>
            <p className="text-muted-foreground mb-4">
              Comece anunciando seu primeiro item no marketplace
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Anunciar Primeiro Item
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card key={item.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-1">{item.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir item</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir "{item.name}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {item.is_featured && (
                    <Badge variant="secondary" className="w-fit">
                      Destaque
                    </Badge>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {item.image_url && (
                    <div className="aspect-video relative overflow-hidden rounded-md">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-primary font-semibold">
                      {item.price_coins} moedas
                    </Badge>
                    <Badge 
                      variant={item.is_active ? "default" : "secondary"}
                    >
                      {item.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {item.stock_quantity !== null && item.stock_quantity !== undefined
                      ? `${item.stock_quantity} em estoque`
                      : 'Estoque ilimitado'}
                  </p>
                  
                  {item.marketplace_categories && (
                    <p className="text-xs text-muted-foreground">
                      Categoria: {item.marketplace_categories.name}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <CreateUserItemDialog
          open={showCreateDialog}
          onOpenChange={handleCloseDialog}
          item={editingItem}
        />
      </div>
    </DashboardLayout>
  );
}