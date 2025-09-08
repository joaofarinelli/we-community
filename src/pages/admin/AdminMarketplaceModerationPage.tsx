import { useState } from 'react';
import { Check, X, Eye, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { usePendingMarketplaceItems, useModerateMarketplaceItem, useAllMarketplaceItemsForModeration } from '@/hooks/usePendingMarketplaceItems';
import { useMarketplaceCategories } from '@/hooks/useMarketplaceCategories';
import { MarketplaceItemPreviewDialog } from '@/components/marketplace/MarketplaceItemPreviewDialog';

interface ModerationDialogData {
  itemId: string;
  itemName: string;
  action: 'approve' | 'reject';
}

export function AdminMarketplaceModerationPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [moderationDialog, setModerationDialog] = useState<ModerationDialogData | null>(null);
  const [moderationNotes, setModerationNotes] = useState('');
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  const { data: pendingItems, isLoading: loadingPending } = usePendingMarketplaceItems();
  const { data: allItems, isLoading: loadingAll } = useAllMarketplaceItemsForModeration();
  const { data: categories } = useMarketplaceCategories();
  const moderateItemMutation = useModerateMarketplaceItem();

  const items = statusFilter === 'pending' ? pendingItems : allItems;
  const isLoading = statusFilter === 'pending' ? loadingPending : loadingAll;

  const filteredItems = items?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    const matchesStatus = statusFilter === 'all' || item.moderation_status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  const handleModeration = (itemId: string, itemName: string, action: 'approve' | 'reject') => {
    setModerationDialog({ itemId, itemName, action });
    setModerationNotes('');
  };

  const confirmModeration = async () => {
    if (!moderationDialog) return;

    await moderateItemMutation.mutateAsync({
      itemId: moderationDialog.itemId,
      action: {
        status: moderationDialog.action === 'approve' ? 'approved' : 'rejected',
        notes: moderationNotes || undefined,
      },
    });

    setModerationDialog(null);
    setModerationNotes('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Aguardando</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Moderação do Marketplace</h1>
          <p className="text-muted-foreground">
            Gerencie e modere os anúncios do marketplace
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Aguardando</SelectItem>
                    <SelectItem value="approved">Aprovados</SelectItem>
                    <SelectItem value="rejected">Rejeitados</SelectItem>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Nenhum item encontrado</p>
              </CardContent>
            </Card>
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{item.name}</h3>
                        {getStatusBadge(item.moderation_status)}
                        <Badge variant="outline" style={{ backgroundColor: item.marketplace_categories?.color + '20', color: item.marketplace_categories?.color }}>
                          {item.marketplace_categories?.name}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span><strong>Preço:</strong> {item.price_coins} moedas</span>
                        <span><strong>Tipo:</strong> {item.item_type === 'physical' ? 'Físico' : 'Digital'}</span>
                        {item.stock_quantity && (
                          <span><strong>Estoque:</strong> {item.stock_quantity}</span>
                        )}
                        <span><strong>Vendedor:</strong> ID: {item.seller_id}</span>
                      </div>

                      {item.moderation_notes && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm"><strong>Observações da moderação:</strong> {item.moderation_notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {item.image_url && (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      
                      <div className="flex flex-col gap-2 ml-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewItem(item)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar produto
                        </Button>
                        
                        {item.moderation_status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleModeration(item.id, item.name, 'approve')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleModeration(item.id, item.name, 'reject')}
                            >
                              <X className="h-4 w-4" />
                              Rejeitar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <MarketplaceItemPreviewDialog
          open={!!previewItem}
          onOpenChange={(open) => !open && setPreviewItem(null)}
          item={previewItem}
        />

        <Dialog open={!!moderationDialog} onOpenChange={() => setModerationDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {moderationDialog?.action === 'approve' ? 'Aprovar Item' : 'Rejeitar Item'}
              </DialogTitle>
              <DialogDescription>
                {moderationDialog?.action === 'approve' 
                  ? `Tem certeza que deseja aprovar "${moderationDialog?.itemName}"? O item ficará disponível no marketplace.`
                  : `Tem certeza que deseja rejeitar "${moderationDialog?.itemName}"? Explique o motivo para o usuário.`
                }
              </DialogDescription>
            </DialogHeader>

            {moderationDialog?.action === 'reject' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Motivo da rejeição</label>
                <Textarea
                  placeholder="Explique por que o item foi rejeitado..."
                  value={moderationNotes}
                  onChange={(e) => setModerationNotes(e.target.value)}
                />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setModerationDialog(null)}>
                Cancelar
              </Button>
              <Button
                onClick={confirmModeration}
                disabled={moderateItemMutation.isPending}
                className={moderationDialog?.action === 'approve' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
                }
              >
                {moderateItemMutation.isPending ? 'Processando...' : 
                 moderationDialog?.action === 'approve' ? 'Aprovar' : 'Rejeitar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
