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
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useMarketplaceCategories } from '@/hooks/useMarketplaceCategories';
import { useCreateMarketplaceItem, useUpdateMarketplaceItem } from '@/hooks/useManageMarketplace';
import { useTags } from '@/hooks/useTags';
import { Switch } from '@/components/ui/switch';
import { ImageUploader } from '@/components/ui/image-uploader';
import { X } from 'lucide-react';

interface MarketplaceItem {
  id?: string;
  category_id: string;
  name: string;
  description?: string;
  image_url?: string;
  price_coins: number;
  stock_quantity?: number;
  is_featured?: boolean;
  access_tags?: string[];
  item_type?: 'physical' | 'digital';
}

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MarketplaceItem;
}

export const CreateItemDialog = ({ open, onOpenChange, item }: CreateItemDialogProps) => {
  const [formData, setFormData] = useState<Partial<MarketplaceItem>>({
    category_id: item?.category_id || '',
    name: item?.name || '',
    description: item?.description || '',
    image_url: item?.image_url || '',
    price_coins: item?.price_coins || 0,
    stock_quantity: item?.stock_quantity || undefined,
    is_featured: item?.is_featured || false,
    access_tags: item?.access_tags || [],
    item_type: item?.item_type || 'physical',
  });

  const { data: categories = [] } = useMarketplaceCategories();
  const { data: tags = [] } = useTags();
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

  const addTag = (tagName: string) => {
    if (!formData.access_tags?.includes(tagName)) {
      setFormData(prev => ({
        ...prev,
        access_tags: [...(prev.access_tags || []), tagName]
      }));
    }
  };

  const removeTag = (tagName: string) => {
    setFormData(prev => ({
      ...prev,
      access_tags: prev.access_tags?.filter(tag => tag !== tagName) || []
    }));
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
              <Label htmlFor="stock">
                {formData.item_type === 'digital' ? 'Licenças' : 'Estoque'} (opcional)
              </Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock_quantity || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  stock_quantity: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                placeholder={formData.item_type === 'digital' ? 'Deixe vazio para licenças ilimitadas' : 'Deixe vazio para estoque ilimitado'}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Item *</Label>
            <RadioGroup
              value={formData.item_type || 'physical'}
              onValueChange={(value) => setFormData(prev => ({ ...prev, item_type: value as 'physical' | 'digital' }))}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="physical" id="physical-admin" />
                <Label htmlFor="physical-admin">Físico</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="digital" id="digital-admin" />
                <Label htmlFor="digital-admin">Digital</Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Itens físicos requerem endereço de entrega. Itens digitais são entregues instantaneamente.
            </p>
          </div>

          <ImageUploader
            value={formData.image_url}
            onChange={(url) => setFormData(prev => ({ ...prev, image_url: url || '' }))}
          />

          <div className="space-y-2">
            <Label>Tags de Acesso (opcional)</Label>
            <p className="text-sm text-muted-foreground">
              Selecione tags para restringir quem pode comprar este produto. Deixe vazio para permitir a todos.
            </p>
            
            {formData.access_tags && formData.access_tags.length > 0 && (
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
                  .filter(tag => !(formData.access_tags || []).includes(tag.name))
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