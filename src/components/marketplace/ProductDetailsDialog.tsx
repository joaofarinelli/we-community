import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Coins, 
  Package, 
  User, 
  Building2, 
  Tag, 
  Calendar, 
  Lock,
  Star,
  ShoppingCart,
  Eye,
  Download,
  Truck
} from 'lucide-react';
import { useState } from 'react';
import { PurchaseDialog } from './PurchaseDialog';
import { useCheckProductAccess } from '@/hooks/useCheckProductAccess';
import { useMarketplaceCategories } from '@/hooks/useMarketplaceCategories';
import { useOtherUserProfileSimple } from '@/hooks/useOtherUserProfileSimple';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  digital_delivery_url?: string;
  created_at: string;
}

interface ProductDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MarketplaceItem;
  userCoins: number;
}

export const ProductDetailsDialog = ({ 
  open, 
  onOpenChange, 
  item, 
  userCoins 
}: ProductDetailsDialogProps) => {
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const { data: hasAccess = true, isLoading: checkingAccess } = useCheckProductAccess(item.id);
  const { data: categories = [] } = useMarketplaceCategories();
  const { data: sellerProfile } = useOtherUserProfileSimple(item.seller_type === 'user' ? item.seller_id : undefined);
  
  const category = categories.find(cat => cat.id === item.category_id);
  const canAfford = userCoins >= item.price_coins;
  const isOutOfStock = item.stock_quantity !== null && item.stock_quantity <= 0;
  const hasRequiredTags = hasAccess;
  const canPurchase = canAfford && !isOutOfStock && hasRequiredTags;

  const handlePurchase = () => {
    onOpenChange(false);
    setShowPurchaseDialog(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes do Produto
            </DialogTitle>
            <DialogDescription>
              Visualize todas as informações sobre este produto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Product Image and Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    item.item_type === 'digital' ? (
                      <Download className="h-16 w-16 text-muted-foreground" />
                    ) : (
                      <Package className="h-16 w-16 text-muted-foreground" />
                    )
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {item.item_type === 'digital' && (
                    <Badge variant="outline" className="text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      Produto Digital
                    </Badge>
                  )}
                  {item.item_type === 'physical' && (
                    <Badge variant="outline" className="text-xs">
                      <Truck className="h-3 w-3 mr-1" />
                      Produto Físico
                    </Badge>
                  )}
                  {item.is_featured && (
                    <Badge variant="secondary" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Destaque
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">{item.name}</h2>
                  {item.description && (
                    <p className="text-muted-foreground mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">Preço:</span>
                      <div className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-primary" />
                        <span className="text-2xl font-bold text-primary">
                          {item.price_coins}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Availability Status */}
                <div className="space-y-2">
                  {item.stock_quantity !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {item.item_type === 'digital' ? 'Licenças:' : 'Estoque:'}
                      </span>
                      <Badge variant={isOutOfStock ? "destructive" : "outline"}>
                        {isOutOfStock ? 'Esgotado' : item.item_type === 'digital' ? `${item.stock_quantity} licenças` : `${item.stock_quantity} disponíveis`}
                      </Badge>
                    </div>
                  )}
                  
                  {item.access_tags && item.access_tags.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Acesso:</span>
                      <Badge variant={hasRequiredTags ? "outline" : "destructive"}>
                        {hasRequiredTags ? (
                          <>
                            <User className="h-3 w-3 mr-1" />
                            Liberado
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3 mr-1" />
                            Restrito
                          </>
                        )}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações do Vendedor</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {item.seller_type === 'company' ? (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {item.seller_type === 'company' 
                          ? 'Empresa' 
                          : sellerProfile 
                            ? `${sellerProfile.first_name} ${sellerProfile.last_name}`
                            : 'Carregando...'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.seller_type === 'company' ? 'Vendedor oficial' : 'Vendedor usuário'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Detalhes do Produto</h3>
                <div className="space-y-3">
                  {category && (
                    <div className="flex items-center gap-3">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{category.name}</p>
                        <p className="text-xs text-muted-foreground">Categoria</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(item.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">Data de publicação</p>
                    </div>
                  </div>
                  
                  {item.item_type && (
                    <div className="flex items-center gap-3">
                      {item.item_type === 'digital' ? (
                        <Download className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Truck className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {item.item_type === 'digital' ? 'Produto Digital' : 'Produto Físico'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.item_type === 'digital' 
                            ? 'Entrega instantânea' 
                            : 'Requer endereço de entrega'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Purchase Summary */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">Resumo da Compra</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Suas moedas atuais:</span>
                    <div className="flex items-center gap-1">
                      <Coins className="h-3 w-3 text-primary" />
                      <span className="font-medium">{userCoins}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Preço do produto:</span>
                    <div className="flex items-center gap-1">
                      <Coins className="h-3 w-3 text-primary" />
                      <span className="font-medium">{item.price_coins}</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Moedas após compra:</span>
                    <div className="flex items-center gap-1">
                      <Coins className="h-3 w-3 text-primary" />
                      <span className={canAfford ? 'text-primary' : 'text-destructive'}>
                        {userCoins - item.price_coins}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Warning Messages */}
            {(!canAfford || !hasRequiredTags || isOutOfStock) && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {!canAfford && (
                      <p className="text-sm text-destructive">
                        ⚠️ Você não tem moedas suficientes para esta compra.
                      </p>
                    )}
                    {!hasRequiredTags && (
                      <p className="text-sm text-destructive">
                        ⚠️ Você não tem acesso a este produto.
                      </p>
                    )}
                    {isOutOfStock && (
                      <p className="text-sm text-destructive">
                        ⚠️ Este produto está esgotado.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Fechar
            </Button>
            <Button 
              onClick={handlePurchase}
              disabled={!canPurchase || checkingAccess}
              className="w-full sm:w-auto"
            >
              {checkingAccess ? (
                'Verificando acesso...'
              ) : isOutOfStock ? (
                'Produto Esgotado'
              ) : !hasRequiredTags ? (
                'Acesso Negado'
              ) : !canAfford ? (
                'Moedas Insuficientes'
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Comprar Agora
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PurchaseDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        item={item}
        userCoins={userCoins}
      />
    </>
  );
};