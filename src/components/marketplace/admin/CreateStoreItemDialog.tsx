import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useMarketplaceCategories } from '@/hooks/useMarketplaceCategories';
import { useCreateStoreItem, useUpdateStoreItem } from '@/hooks/useManageStore';
import { useTags } from '@/hooks/useTags';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Store, X } from 'lucide-react';

interface MarketplaceItem {
  id?: string;
  category_id: string;
  name: string;
  description: string;
  image_url: string;
  price_coins: number;
  stock_quantity: number | null;
  is_featured: boolean;
  access_tags?: string[];
  item_type?: 'physical' | 'digital';
}

interface CreateStoreItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MarketplaceItem | null;
}

export const CreateStoreItemDialog = ({ open, onOpenChange, item }: CreateStoreItemDialogProps) => {
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    image_url: '',
    price_coins: 0,
    stock_quantity: null as number | null,
    is_featured: false,
    access_tags: [] as string[],
    item_type: 'physical' as 'physical' | 'digital',
  });

  const { data: categories = [] } = useMarketplaceCategories();
  const { data: tags = [] } = useTags();
  const createItem = useCreateStoreItem();
  const updateItem = useUpdateStoreItem();

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
        access_tags: item.access_tags || [],
        item_type: item.item_type || 'physical',
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
        access_tags: [],
        item_type: 'physical',
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
        store_type: 'store' as const,
        seller_type: 'company' as const,
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

  const addTag = (tagName: string) => {
    if (!formData.access_tags.includes(tagName)) {
      setFormData(prev => ({
        ...prev,
        access_tags: [...prev.access_tags, tagName]
      }));
    }
  };

  const removeTag = (tagName: string) => {
    setFormData(prev => ({
      ...prev,
      access_tags: prev.access_tags.filter(tag => tag !== tagName)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {item ? 'Editar Produto da Loja' : 'Novo Produto da Loja'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {item ? 'Edite as informações do produto da loja.' : 'Adicione um novo produto à loja oficial para venda com moedas.'}
          </p>
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
            <Label>Tipo de Produto *</Label>
            <RadioGroup
              value={formData.item_type}
              onValueChange={(value) => setFormData({ ...formData, item_type: value as 'physical' | 'digital' })}
              className="flex gap-6 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="physical" id="physical-store" />
                <Label htmlFor="physical-store">Físico</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="digital" id="digital-store" />
                <Label htmlFor="digital-store">Digital</Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground mt-1">
              Produtos físicos requerem endereço de entrega. Produtos digitais são entregues instantaneamente.
            </p>
          </div>

          <div>
            <Label htmlFor="stock">
              {formData.item_type === 'digital' ? 'Quantidade de Licenças' : 'Quantidade em Estoque'}
            </Label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={formData.stock_quantity || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                stock_quantity: e.target.value ? parseInt(e.target.value) : null 
              })}
              placeholder={formData.item_type === 'digital' ? 'Deixe vazio para licenças ilimitadas' : 'Deixe vazio para estoque ilimitado'}
            />
          </div>

          <ImageUploader
            value={formData.image_url}
            onChange={(url) => setFormData({ ...formData, image_url: url || '' })}
          />

          <div>
            <Label>Tags de Acesso (opcional)</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Selecione tags para restringir quem pode comprar este produto. Deixe vazio para permitir a todos.
            </p>
            
            {formData.access_tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.access_tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
            
            <Select onValueChange={addTag}>
              <SelectTrigger>
                <SelectValue placeholder="Adicionar tag de acesso" />
              </SelectTrigger>
              <SelectContent>
                {tags
                  .filter(tag => !formData.access_tags.includes(tag.name))
                  .map((tag) => (
                    <SelectItem key={tag.id} value={tag.name}>
                      {tag.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
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