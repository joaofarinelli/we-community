import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMarketplaceCategories } from '@/hooks/useMarketplaceCategories';
import { useDeleteMarketplaceCategory } from '@/hooks/useManageMarketplace';
import { CreateCategoryDialog } from '@/components/marketplace/admin/CreateCategoryDialog';
import { Plus, Edit, Trash2, Store } from 'lucide-react';
import { useState } from 'react';

export const AdminStoreCategoriesPage = () => {
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  
  const { data: categories = [] } = useMarketplaceCategories();
  const deleteCategory = useDeleteMarketplaceCategory();

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setShowCategoryDialog(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria da loja?')) {
      await deleteCategory.mutateAsync(id);
    }
  };

  const handleCloseCategoryDialog = () => {
    setShowCategoryDialog(false);
    setEditingCategory(null);
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Store className="h-6 w-6" />
              Categorias da Loja
            </h1>
            <p className="text-muted-foreground">
              Gerencie as categorias dos produtos da loja oficial
            </p>
          </div>
          
          <Button onClick={() => setShowCategoryDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        </div>

        <div className="grid gap-4">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{category.name}</h3>
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                    {category.description && (
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {categories.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Store className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma categoria encontrada</h3>
                <p className="text-muted-foreground text-center">
                  Comece criando sua primeira categoria da loja
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <CreateCategoryDialog
          open={showCategoryDialog}
          onOpenChange={handleCloseCategoryDialog}
          category={editingCategory}
        />
      </div>
    </AdminLayout>
  );
};