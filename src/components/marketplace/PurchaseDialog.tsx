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

interface MarketplaceItem {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price_coins: number;
  stock_quantity: number | null;
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

  const handlePurchase = async () => {
    if (!canAfford) return;
    
    await purchaseItem.mutateAsync({ itemId: item.id });
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
            disabled={!canAfford || purchaseItem.isPending}
          >
            {purchaseItem.isPending ? 'Processando...' : 'Confirmar Compra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};