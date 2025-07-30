import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useMarketplaceCategories } from '@/hooks/useMarketplaceCategories';
import { useStoreItems } from '@/hooks/useStoreItems';
import { useDeleteMarketplaceItem } from '@/hooks/useManageMarketplace';
import { CreateStoreItemDialog } from '@/components/marketplace/admin/CreateStoreItemDialog';
import { Plus, Search, Package, Eye, EyeOff, Edit, Trash2, Coins, Store } from 'lucide-react';

export const AdminStorePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const { data: categories = [] } = useMarketplaceCategories();
  const { data: items = [] } = useStoreItems();
  const deleteItem = useDeleteMarketplaceItem();

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setShowItemDialog(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item da loja?')) {
      await deleteItem.mutateAsync(id);
    }
  };

  const handleCloseItemDialog = () => {
    setShowItemDialog(false);
    setEditingItem(null);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (!selectedCategory || item.category_id === selectedCategory)
  );

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Gerenciar Loja</h1>
            <p className="text-muted-foreground">
              Gerencie produtos da loja oficial (apenas administradores podem adicionar itens)
            </p>
          </div>
          
          <Button onClick={() => setShowItemDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto da Loja
          </Button>
        </div>

        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="">Todas as categorias</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lista de Produtos */}
          <div className="grid gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Store className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{item.name}</h3>
                        {item.is_featured && (
                          <Badge variant="secondary">Destaque</Badge>
                        )}
                        <Badge variant={item.is_active ? "default" : "secondary"}>
                          {item.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                        <Badge variant="outline">
                          <Store className="h-3 w-3 mr-1" />
                          Loja
                        </Badge>
                      </div>
                      
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Coins className="h-4 w-4" />
                          <span>{item.price_coins} moedas</span>
                        </div>
                        {item.stock_quantity !== null && (
                          <span>Estoque: {item.stock_quantity}</span>
                        )}
                        <span>Categoria: {categories.find(c => c.id === item.category_id)?.name}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditItem({ ...item, is_active: !item.is_active })}
                      >
                        {item.is_active ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredItems.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Store className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
                  <p className="text-muted-foreground text-center">
                    {searchTerm || selectedCategory
                      ? 'Tente ajustar os filtros de busca'
                      : 'Comece criando seu primeiro produto da loja'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Dialog */}
        <CreateStoreItemDialog
          open={showItemDialog}
          onOpenChange={handleCloseItemDialog}
          item={editingItem}
        />
      </div>
    </AdminLayout>
  );
};