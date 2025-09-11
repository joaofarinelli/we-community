import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Coins, Package, Calendar } from 'lucide-react';
import { TMBProduct } from '@/hooks/useTMBProducts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TMBProductCardProps {
  product: TMBProduct;
  onToggleActive?: (productId: string, isActive: boolean) => void;
  onViewDetails?: (product: TMBProduct) => void;
}

export const TMBProductCard = ({ product, onToggleActive, onViewDetails }: TMBProductCardProps) => {
  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight mb-1 truncate" title={product.name}>
              {product.name}
            </h3>
            {product.category && (
              <Badge variant="secondary" className="text-xs">
                {product.category}
              </Badge>
            )}
          </div>
          <Badge 
            variant={product.is_active ? "default" : "secondary"}
            className="shrink-0"
          >
            {product.is_active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        {product.image_url && (
          <div className="aspect-video w-full mb-3 rounded-md overflow-hidden bg-muted">
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {product.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Preço BRL:</span>
            <span className="font-medium">{formatCurrency(product.price_brl)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Moedas:</span>
            <div className="flex items-center gap-1">
              <Coins className="h-3 w-3 text-primary" />
              <span className="font-medium">{product.price_coins || 0}</span>
            </div>
          </div>

          {product.stock_quantity !== null && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estoque:</span>
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span className="font-medium">{product.stock_quantity}</span>
              </div>
            </div>
          )}

          {product.last_synced_at && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Última sync:</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(product.last_synced_at), 'dd/MM/yy HH:mm', { locale: ptBR })}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onViewDetails?.(product)}
        >
          Detalhes
        </Button>
        
        {onToggleActive && (
          <Button
            variant={product.is_active ? "secondary" : "default"}
            size="sm"
            className="flex-1"
            onClick={() => onToggleActive(product.id, !product.is_active)}
          >
            {product.is_active ? 'Desativar' : 'Ativar'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};