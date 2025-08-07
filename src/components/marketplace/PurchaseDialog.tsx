import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coins, Package } from 'lucide-react';
import { usePurchaseItem } from '@/hooks/useMarketplacePurchases';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface MarketplaceItem {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price_coins: number;
  stock_quantity: number | null;
  item_type?: string;
}

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MarketplaceItem;
  userCoins: number;
}

export const PurchaseDialog = ({ open, onOpenChange, item, userCoins }: PurchaseDialogProps) => {
  const purchaseItem = usePurchaseItem();
  const canAfford = userCoins >= item.price_coins;

  const [delivery, setDelivery] = useState({
    address: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    postal_code: '',
  });
  const requiresDelivery = item.item_type === 'physical';
  const isDeliveryValid =
    !requiresDelivery ||
    (delivery.address && delivery.number && delivery.neighborhood && delivery.city && delivery.state && delivery.postal_code);

  const handlePurchase = async () => {
    if (!canAfford || (requiresDelivery && !isDeliveryValid)) return;
    
    await purchaseItem.mutateAsync({ itemId: item.id, delivery: requiresDelivery ? delivery : {} });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Compra</DialogTitle>
          <DialogDescription>
            Você está prestes a comprar este item usando suas WomanCoins.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center shrink-0">
              {item.image_url ? (
                <img 
                  src={item.image_url} 
                  alt={item.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Package className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {item.description}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm">Preço:</span>
              <div className="flex items-center gap-1">
                <Coins className="h-4 w-4 text-primary" />
                <span className="font-medium">{item.price_coins}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Suas moedas:</span>
              <div className="flex items-center gap-1">
                <Coins className="h-4 w-4 text-primary" />
                <span className="font-medium">{userCoins}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-sm font-medium">Moedas após compra:</span>
              <div className="flex items-center gap-1">
                <Coins className="h-4 w-4 text-primary" />
                <span className="font-medium">{userCoins - item.price_coins}</span>
              </div>
            </div>
          </div>
          {requiresDelivery && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Endereço de entrega</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={delivery.address}
                    onChange={(e) => setDelivery({ ...delivery, address: e.target.value })}
                    placeholder="Rua/Avenida"
                  />
                </div>
                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={delivery.number}
                    onChange={(e) => setDelivery({ ...delivery, number: e.target.value })}
                    placeholder="123"
                  />
                </div>
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={delivery.neighborhood}
                    onChange={(e) => setDelivery({ ...delivery, neighborhood: e.target.value })}
                    placeholder="Bairro"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={delivery.city}
                    onChange={(e) => setDelivery({ ...delivery, city: e.target.value })}
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={delivery.state}
                    onChange={(e) => setDelivery({ ...delivery, state: e.target.value })}
                    placeholder="UF"
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">CEP</Label>
                  <Input
                    id="postal_code"
                    value={delivery.postal_code}
                    onChange={(e) => setDelivery({ ...delivery, postal_code: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>
          )}

          {!canAfford && (
            <p className="text-sm text-destructive">
              Você não tem moedas suficientes para esta compra.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={purchaseItem.isPending}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handlePurchase}
            disabled={!canAfford || purchaseItem.isPending || !isDeliveryValid}
          >
            {purchaseItem.isPending ? 'Processando...' : 'Confirmar Compra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};