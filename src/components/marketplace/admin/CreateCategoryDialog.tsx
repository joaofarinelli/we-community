import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateMarketplaceCategory, useUpdateMarketplaceCategory } from '@/hooks/useManageMarketplace';

interface MarketplaceCategory {
  id?: string;
  name: string;
  description?: string;
  icon_value?: string;
  color?: string;
}

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: MarketplaceCategory;
}

export const CreateCategoryDialog = ({ open, onOpenChange, category }: CreateCategoryDialogProps) => {
  const [formData, setFormData] = useState<Partial<MarketplaceCategory>>({
    name: category?.name || '',
    description: category?.description || '',
    icon_value: category?.icon_value || 'Package',
    color: category?.color || '#3B82F6',
  });

  const createCategory = useCreateMarketplaceCategory();
  const updateCategory = useUpdateMarketplaceCategory();

  const isEditing = !!category?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) return;

    try {
      if (isEditing && category?.id) {
        await updateCategory.mutateAsync({ 
          id: category.id, 
          data: formData as any 
        });
      } else {
        await createCategory.mutateAsync(formData as any);
      }
      onOpenChange(false);
      setFormData({});
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isLoading = createCategory.isPending || updateCategory.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Categoria' : 'Criar Nova Categoria'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Edite as informações da categoria.'
              : 'Crie uma nova categoria para organizar os itens do marketplace.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Categoria *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome da categoria"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva a categoria"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Ícone</Label>
              <Input
                id="icon"
                value={formData.icon_value || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, icon_value: e.target.value }))}
                placeholder="Package"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color || '#3B82F6'}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-16 h-10"
                />
                <Input
                  value={formData.color || '#3B82F6'}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Categoria'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};