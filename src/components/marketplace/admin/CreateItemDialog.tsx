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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMarketplaceCategories } from '@/hooks/useMarketplaceCategories';
import { useCreateMarketplaceItem, useUpdateMarketplaceItem } from '@/hooks/useManageMarketplace';
import { Switch } from '@/components/ui/switch';
import { Image } from 'lucide-react';

interface MarketplaceItem {
  id?: string;
  category_id: string;
  name: string;
  description?: string;
  image_url?: string;
  price_coins: number;
  stock_quantity?: number;
  is_featured?: boolean;
}

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MarketplaceItem;
}

const placeholderImages = [
  { id: 'photo-1649972904349-6e44c42644a7', name: 'Mulher trabalhando no laptop' },
  { id: 'photo-1488590528505-98d2b5aba04b', name: 'Laptop cinza ligado' },
  { id: 'photo-1518770660439-4636190af475', name: 'Placa de circuito' },
  { id: 'photo-1461749280684-dccba630e2f6', name: 'Monitor com código Java' },
  { id: 'photo-1486312338219-ce68d2c6f44d', name: 'Pessoa usando MacBook Pro' },
  { id: 'photo-1581091226825-a6a2a5aee158', name: 'Mulher de blusa branca usando laptop' },
  { id: 'photo-1485827404703-89b55fcc595e', name: 'Robô branco' },
  { id: 'photo-1526374965328-7f61d4dc18c5', name: 'Matrix' },
  { id: 'photo-1487058792275-0ad4aaf24ca7', name: 'Código colorido no monitor' },
  { id: 'photo-1473091534298-04dcbce3278c', name: 'Caneta stylus' },
];

export const CreateItemDialog = ({ open, onOpenChange, item }: CreateItemDialogProps) => {
  const [formData, setFormData] = useState<Partial<MarketplaceItem>>({
    category_id: item?.category_id || '',
    name: item?.name || '',
    description: item?.description || '',
    image_url: item?.image_url || '',
    price_coins: item?.price_coins || 0,
    stock_quantity: item?.stock_quantity || undefined,
    is_featured: item?.is_featured || false,
  });

  const { data: categories = [] } = useMarketplaceCategories();
  const createItem = useCreateMarketplaceItem();
  const updateItem = useUpdateMarketplaceItem();

  const isEditing = !!item?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category_id || !formData.name || formData.price_coins === undefined) {
      return;
    }

    try {
      if (isEditing && item?.id) {
        await updateItem.mutateAsync({ 
          id: item.id, 
          data: formData as any 
        });
      } else {
        await createItem.mutateAsync(formData as any);
      }
      onOpenChange(false);
      setFormData({});
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isLoading = createItem.isPending || updateItem.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Item' : 'Criar Novo Item'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Edite as informações do item do marketplace.'
              : 'Adicione um novo item ao marketplace para venda com WomanCoins.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.category_id || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
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
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do produto ou serviço"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o item em detalhes"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço em WomanCoins *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={formData.price_coins || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, price_coins: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Estoque (opcional)</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock_quantity || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  stock_quantity: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                placeholder="Deixe vazio para estoque ilimitado"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Imagem do Item</Label>
            <div className="space-y-3">
              <Input
                value={formData.image_url || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="URL da imagem ou selecione uma imagem de exemplo abaixo"
              />
              
              <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto">
                {placeholderImages.map((img) => {
                  const imageUrl = `https://images.unsplash.com/${img.id}?w=200&h=150&fit=crop`;
                  return (
                    <button
                      key={img.id}
                      type="button"
                      className={`aspect-square rounded border-2 overflow-hidden ${
                        formData.image_url === imageUrl 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, image_url: imageUrl }))}
                    >
                      <img 
                        src={imageUrl} 
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
              
              {formData.image_url && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Image className="h-4 w-4" />
                  <span className="text-sm">Imagem selecionada</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="featured"
              checked={formData.is_featured || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
            />
            <Label htmlFor="featured">Item em destaque</Label>
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
              {isLoading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};