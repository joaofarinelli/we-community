import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useMarketplaceCategories } from '@/hooks/useMarketplaceCategories';
import { useCreateMarketplaceItem, useUpdateMarketplaceItem } from '@/hooks/useManageMarketplace';
import { Store } from 'lucide-react';

interface MarketplaceItem {
  id?: string;
  category_id: string;
  name: string;
  description: string;
  image_url: string;
  price_coins: number;
  stock_quantity: number | null;
  is_featured: boolean;
}

interface CreateStoreItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MarketplaceItem | null;
}

const placeholderImages = [
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
];

export const CreateStoreItemDialog = ({ open, onOpenChange, item }: CreateStoreItemDialogProps) => {
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    image_url: '',
    price_coins: 0,
    stock_quantity: null as number | null,
    is_featured: false,
  });

  const { data: categories = [] } = useMarketplaceCategories();
  const createItem = useCreateMarketplaceItem();
  const updateItem = useUpdateMarketplaceItem();

  const isLoading = createItem.isPending || updateItem.isPending;

  useEffect(() => {
    if (item) {
      setFormData({
        category_id: item.category_id,
        name: item.name,
        description: item.description,
        image_url: item.image_url,
        price_coins: item.price_coins,
        stock_quantity: item.stock_quantity,
        is_featured: item.is_featured,
      });
    } else {
      setFormData({
        category_id: '',
        name: '',
        description: '',
        image_url: '',
        price_coins: 0,
        stock_quantity: null,
        is_featured: false,
      });
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category_id || formData.price_coins <= 0) {
      return;
    }

    try {
      const itemData = {
        ...formData,
        store_type: 'store' as const, // Force store type for store items
        seller_type: 'company' as const, // Store items are always sold by company
      };

      if (item?.id) {
        await updateItem.mutateAsync({ id: item.id, data: itemData });
      } else {
        await createItem.mutateAsync(itemData);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving store item:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {item ? 'Editar Produto da Loja' : 'Novo Produto da Loja'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
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

          <div>
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Digite o nome do produto"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o produto"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="price">Preço em Moedas *</Label>
            <Input
              id="price"
              type="number"
              min="1"
              value={formData.price_coins}
              onChange={(e) => setFormData({ ...formData, price_coins: parseInt(e.target.value) || 0 })}
              placeholder="0"
              required
            />
          </div>

          <div>
            <Label htmlFor="stock">Quantidade em Estoque</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={formData.stock_quantity || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                stock_quantity: e.target.value ? parseInt(e.target.value) : null 
              })}
              placeholder="Deixe vazio para estoque ilimitado"
            />
          </div>

          <div>
            <Label>Imagem do Produto</Label>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {placeholderImages.map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFormData({ ...formData, image_url: img })}
                    className={`relative aspect-video rounded-lg border-2 transition-all ${
                      formData.image_url === img 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-dashed border-muted-foreground/25 hover:border-muted-foreground/50'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`Opção ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </button>
                ))}
              </div>
              
              <div>
                <Label htmlFor="custom-image">Ou insira uma URL personalizada:</Label>
                <Input
                  id="custom-image"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
            />
            <Label htmlFor="featured">Produto em destaque</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : item ? 'Atualizar Produto' : 'Criar Produto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};