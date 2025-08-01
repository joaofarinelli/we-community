import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMarketplaceCategories } from '@/hooks/useMarketplaceCategories';
import { useCreateUserMarketplaceItem, useUpdateUserMarketplaceItem } from '@/hooks/useUserMarketplaceItems';
import { ImageUploader } from '@/components/ui/image-uploader';

interface MarketplaceItem {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  image_url?: string;
  price_coins: number;
  stock_quantity?: number;
}

interface CreateUserItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MarketplaceItem;
}


export const CreateUserItemDialog = ({ open, onOpenChange, item }: CreateUserItemDialogProps) => {
  const [formData, setFormData] = useState({
    category_id: item?.category_id || '',
    name: item?.name || '',
    description: item?.description || '',
    image_url: item?.image_url || '',
    price_coins: item?.price_coins || 0,
    stock_quantity: item?.stock_quantity || undefined,
  });

  const { data: categories = [] } = useMarketplaceCategories();
  const createItem = useCreateUserMarketplaceItem();
  const updateItem = useUpdateUserMarketplaceItem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category_id || formData.price_coins <= 0) {
      return;
    }

    try {
      if (item) {
        await updateItem.mutateAsync({ id: item.id, data: formData });
      } else {
        await createItem.mutateAsync(formData);
      }
      onOpenChange(false);
      setFormData({
        category_id: '',
        name: '',
        description: '',
        image_url: '',
        price_coins: 0,
        stock_quantity: undefined,
      });
    } catch (error) {
      console.error('Error creating/updating item:', error);
    }
  };

  const isLoading = createItem.isPending || updateItem.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Editar Item' : 'Criar Novo Item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome do Item *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Digite o nome do item"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Digite a descrição do item"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Preço em Moedas *</Label>
            <Input
              id="price"
              type="number"
              min="1"
              value={formData.price_coins}
              onChange={(e) => setFormData({ ...formData, price_coins: parseInt(e.target.value) || 0 })}
              placeholder="Digite o preço em moedas"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Quantidade em Estoque (opcional)</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={formData.stock_quantity || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                stock_quantity: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              placeholder="Deixe vazio para estoque ilimitado"
            />
          </div>

          <ImageUploader
            value={formData.image_url}
            onChange={(url) => setFormData({ ...formData, image_url: url || '' })}
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name || !formData.category_id || formData.price_coins <= 0}
              className="flex-1"
            >
              {isLoading ? 'Salvando...' : item ? 'Atualizar Item' : 'Criar Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};