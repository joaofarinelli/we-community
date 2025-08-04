import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Package, Lock, Download, Package2 } from 'lucide-react';
import { useState, memo } from 'react';
import { ProductDetailsDialog } from './ProductDetailsDialog';
import { useCheckProductAccess } from '@/hooks/useCheckProductAccess';

interface MarketplaceItem {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price_coins: number;
  stock_quantity: number | null;
  is_featured: boolean;
  seller_type: string;
  seller_id?: string;
  category_id: string;
  access_tags?: string[];
  item_type?: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface MarketplaceItemCardProps {
  item: MarketplaceItem;
  userCoins: number;
}

export const MarketplaceItemCard = memo(({ item, userCoins }: MarketplaceItemCardProps) => {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { data: hasAccess = true, isLoading: checkingAccess } = useCheckProductAccess(item.id);
  
  const canAfford = userCoins >= item.price_coins;
  const isOutOfStock = item.stock_quantity !== null && item.stock_quantity <= 0;
  const hasRequiredTags = hasAccess;
  const canPurchase = canAfford && !isOutOfStock && hasRequiredTags;

  return (
    <>
      <Card className="h-full flex flex-col cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowDetailsDialog(true)}>
        <CardContent className="p-4 flex-1">
          <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
            {item.image_url ? (
              <img 
                src={item.image_url} 
                alt={item.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              item.item_type === 'digital' ? (
                <Download className="h-12 w-12 text-muted-foreground" />
              ) : (
                <Package className="h-12 w-12 text-muted-foreground" />
              )
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="font-medium text-sm leading-tight">{item.name}</h3>
              <div className="flex gap-1 ml-2 shrink-0">
                {item.item_type === 'digital' && (
                  <Badge variant="outline" className="text-xs">
                    <Download className="h-3 w-3 mr-1" />
                    Digital
                  </Badge>
                )}
                {item.is_featured && (
                  <Badge variant="secondary">
                    Destaque
                  </Badge>
                )}
              </div>
            </div>
            
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            )}
            
            <p className="text-xs text-muted-foreground">
              Vendido por:{' '}
              {item.seller_type === 'company' 
                ? 'Empresa' 
                : `${item.profiles?.first_name} ${item.profiles?.last_name}`}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Coins className="h-4 w-4 text-primary" />
                <span className="font-medium">{item.price_coins}</span>
              </div>
              
              {item.stock_quantity !== null && (
                <Badge variant={isOutOfStock ? "destructive" : "outline"} className="text-xs">
                  {isOutOfStock ? 'Esgotado' : item.item_type === 'digital' ? `${item.stock_quantity} licenças` : `${item.stock_quantity} restantes`}
                </Badge>
              )}
            </div>
            
            {item.access_tags && item.access_tags.length > 0 && !hasRequiredTags && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Acesso restrito</span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full" 
            onClick={(e) => {
              e.stopPropagation();
              setShowDetailsDialog(true);
            }}
            disabled={checkingAccess}
            variant="outline"
          >
            {checkingAccess ? 'Carregando...' : 'Ver Detalhes'}
          </Button>
        </CardFooter>
      </Card>

      <ProductDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        item={item}
        userCoins={userCoins}
      />
    </>
  );
});