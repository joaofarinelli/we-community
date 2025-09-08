import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Coins, Package, Download, User, Building } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  item_type?: string;
  digital_delivery_url?: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
  marketplace_categories?: {
    name: string;
    color: string;
  };
}

interface MarketplaceItemPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MarketplaceItem;
}

export const MarketplaceItemPreviewDialog = ({
  open,
  onOpenChange,
  item,
}: MarketplaceItemPreviewDialogProps) => {
  const isOutOfStock = item.stock_quantity !== null && item.stock_quantity <= 0;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Prévia do Produto no Marketplace
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Imagem do produto */}
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              {item.image_url ? (
                <img 
                  src={item.image_url} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  {item.item_type === 'digital' ? (
                    <Download className="h-16 w-16" />
                  ) : (
                    <Package className="h-16 w-16" />
                  )}
                  <span className="text-sm">Sem imagem</span>
                </div>
              )}
            </div>
            
            {/* Informações do produto */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{item.name}</h2>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.marketplace_categories && (
                      <Badge 
                        variant="outline" 
                        style={{ 
                          backgroundColor: item.marketplace_categories.color + '20', 
                          color: item.marketplace_categories.color 
                        }}
                      >
                        {item.marketplace_categories.name}
                      </Badge>
                    )}
                    {item.item_type === 'digital' && (
                      <Badge variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Digital
                      </Badge>
                    )}
                    {item.is_featured && (
                      <Badge variant="secondary">Destaque</Badge>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                    <Coins className="h-6 w-6" />
                    {item.price_coins}
                  </div>
                  <p className="text-sm text-muted-foreground">moedas</p>
                </div>
              </div>
              
              {/* Descrição */}
              {item.description && (
                <div>
                  <h3 className="font-semibold mb-2">Descrição</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {item.description}
                  </p>
                </div>
              )}
              
              {/* Informações do vendedor */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  {item.seller_type === 'company' ? (
                    <Building className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  Vendedor
                </h3>
                <p className="text-sm">
                  {item.seller_type === 'company' 
                    ? 'Empresa' 
                    : `${item.profiles?.first_name} ${item.profiles?.last_name}`}
                </p>
              </div>
              
              {/* Estoque */}
              {item.stock_quantity !== null && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Estoque disponível</span>
                  <Badge variant={isOutOfStock ? "destructive" : "outline"}>
                    {isOutOfStock 
                      ? 'Esgotado' 
                      : item.item_type === 'digital' 
                        ? `${item.stock_quantity} licenças` 
                        : `${item.stock_quantity} unidades`
                    }
                  </Badge>
                </div>
              )}
              
              {/* Botão de compra (simulação) */}
              <div className="border-t pt-4">
                <Button 
                  className="w-full" 
                  size="lg"
                  disabled={isOutOfStock}
                >
                  <Coins className="h-4 w-4 mr-2" />
                  {isOutOfStock ? 'Esgotado' : `Comprar por ${item.price_coins} moedas`}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  * Esta é apenas uma prévia. Os usuários verão o produto assim no marketplace.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};