import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Package } from 'lucide-react';
import { useState } from 'react';
import { PurchaseDialog } from './PurchaseDialog';

interface MarketplaceItem {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price_coins: number;
  stock_quantity: number | null;
  is_featured: boolean;
}

interface MarketplaceItemCardProps {
  item: MarketplaceItem;
  userCoins: number;
}

export const MarketplaceItemCard = ({ item, userCoins }: MarketplaceItemCardProps) => {
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const canAfford = userCoins >= item.price_coins;
  const isOutOfStock = item.stock_quantity !== null && item.stock_quantity <= 0;

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardContent className="p-4 flex-1">
          <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
            {item.image_url ? (
              <img 
                src={item.image_url} 
                alt={item.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Package className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="font-medium text-sm leading-tight">{item.name}</h3>
              {item.is_featured && (
                <Badge variant="secondary" className="ml-2 shrink-0">
                  Destaque
                </Badge>
              )}
            </div>
            
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Coins className="h-4 w-4 text-primary" />
                <span className="font-medium">{item.price_coins}</span>
              </div>
              
              {item.stock_quantity !== null && (
                <Badge variant={isOutOfStock ? "destructive" : "outline"} className="text-xs">
                  {isOutOfStock ? 'Esgotado' : `${item.stock_quantity} restantes`}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full" 
            onClick={() => setShowPurchaseDialog(true)}
            disabled={!canAfford || isOutOfStock}
            variant={!canAfford ? "outline" : "default"}
          >
            {isOutOfStock ? 'Esgotado' : !canAfford ? 'Moedas insuficientes' : 'Comprar'}
          </Button>
        </CardFooter>
      </Card>

      <PurchaseDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        item={item}
        userCoins={userCoins}
      />
    </>
  );
};