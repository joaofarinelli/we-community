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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMarketplaceCategories } from '@/hooks/useMarketplaceCategories';
import { useCreateUserMarketplaceItem, useUpdateUserMarketplaceItem } from '@/hooks/useUserMarketplaceItems';
import { useMarketplaceTerms } from '@/hooks/useMarketplaceTerms';
import { ImageUploader } from '@/components/ui/image-uploader';
import { toast } from 'sonner';
import { AlertTriangle, FileText } from 'lucide-react';

interface MarketplaceItem {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  image_url?: string;
  price_coins: number;
  stock_quantity?: number;
  item_type?: 'physical' | 'digital';
  digital_delivery_url?: string;
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
    item_type: item?.item_type || 'physical' as 'physical' | 'digital',
    digital_delivery_url: (item as any)?.digital_delivery_url || '',
  });

  const [termsAccepted, setTermsAccepted] = useState(false);

  const { data: categories = [] } = useMarketplaceCategories();
  const { data: activeTerms } = useMarketplaceTerms();
  const createItem = useCreateUserMarketplaceItem();
  const updateItem = useUpdateUserMarketplaceItem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category_id || formData.price_coins <= 0) {
      return;
    }
    if (formData.item_type === 'digital' && !formData.digital_delivery_url) {
      toast.error('Informe o link de entrega para produtos digitais.');
      return;
    }

    // Check terms acceptance for new items
    if (!item && !termsAccepted) {
      toast.error('Você deve aceitar os termos para continuar.');
      return;
    }

    try {
      if (item) {
        await updateItem.mutateAsync({ id: item.id, data: formData });
      } else {
        const itemData = {
          ...formData,
          ...(activeTerms?.id && { terms_acceptance: { terms_id: activeTerms.id } }),
        };
        await createItem.mutateAsync(itemData);
      }
      onOpenChange(false);
      setFormData({
        category_id: '',
        name: '',
        description: '',
        image_url: '',
        price_coins: 0,
        stock_quantity: undefined,
        item_type: 'physical',
        digital_delivery_url: '',
      });
      setTermsAccepted(false);
    } catch (error) {
      console.error('Error creating/updating item:', error);
    }
  };

  const isLoading = createItem.isPending || updateItem.isPending;

  // Show warning if no terms are configured (for new items only)
  if (!item && !activeTerms) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Termos não configurados
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A administração ainda não configurou os termos de anúncio para o marketplace. 
              Não é possível criar novos anúncios no momento.
            </p>
            <p className="text-sm text-muted-foreground">
              Entre em contato com a administração para mais informações.
            </p>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Editar Item' : 'Criar Novo Item'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6 pb-6">
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
                  <Label>Tipo de Item *</Label>
                  <RadioGroup
                    value={formData.item_type}
                    onValueChange={(value) => setFormData({ ...formData, item_type: value as 'physical' | 'digital' })}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="physical" id="physical" />
                      <Label htmlFor="physical">Físico</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="digital" id="digital" />
                      <Label htmlFor="digital">Digital</Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground">
                    Itens físicos requerem endereço de entrega. Itens digitais são entregues instantaneamente.
                  </p>
                </div>

                {formData.item_type === 'digital' && (
                  <div className="space-y-2">
                    <Label htmlFor="digital_delivery_url">Link de entrega (URL) *</Label>
                    <Input
                      id="digital_delivery_url"
                      type="url"
                      value={formData.digital_delivery_url}
                      onChange={(e) => setFormData({ ...formData, digital_delivery_url: e.target.value })}
                      placeholder="https://exemplo.com/meu-produto"
                      required={formData.item_type === 'digital'}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="stock">
                    {formData.item_type === 'digital' ? 'Quantidade de Licenças (opcional)' : 'Quantidade em Estoque (opcional)'}
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock_quantity || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      stock_quantity: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    placeholder={formData.item_type === 'digital' ? 'Deixe vazio para licenças ilimitadas' : 'Deixe vazio para estoque ilimitado'}
                  />
                </div>

                <ImageUploader
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url || '' })}
                />

                {/* Terms Acceptance (only for new items) */}
                {!item && activeTerms && (
                  <div className="space-y-4 border-t pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5" />
                      <h3 className="font-semibold">Termos de Anúncio</h3>
                    </div>
                    
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Antes de prosseguir, leia e aceite os termos abaixo. Seu anúncio passará por análise da administração antes de ser publicado.
                      </AlertDescription>
                    </Alert>

                    <div className="border rounded-lg p-4 bg-muted/50">
                      <ScrollArea className="h-48">
                        <pre className="whitespace-pre-wrap text-sm">{activeTerms.content}</pre>
                      </ScrollArea>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                      />
                      <Label htmlFor="terms" className="text-sm leading-relaxed">
                        Li e aceito os Termos de Anúncio acima. Entendo que meu anúncio será analisado pela administração antes da publicação.
                      </Label>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-3 pt-4 border-t">
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
                disabled={
                  isLoading || 
                  !formData.name || 
                  !formData.category_id || 
                  formData.price_coins <= 0 ||
                  (!item && !termsAccepted) // Require terms acceptance for new items
                }
                className="flex-1"
              >
                {isLoading ? 'Salvando...' : item ? 'Atualizar Item' : 'Enviar para Análise'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};