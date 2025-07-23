import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useMarketplacePurchases } from '@/hooks/useMarketplacePurchases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Coins, Package, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const MarketplacePurchasesPage = () => {
  const { data: purchases = [], isLoading } = useMarketplacePurchases();

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/marketplace">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Marketplace
            </Link>
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">Minhas Compras</h1>
            <p className="text-muted-foreground">
              Histórico de todas as suas compras no marketplace
            </p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-muted animate-pulse rounded-lg h-32" />
            ))}
          </div>
        ) : purchases.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma compra encontrada</h3>
              <p className="text-muted-foreground text-center mb-4">
                Você ainda não fez nenhuma compra no marketplace.
              </p>
              <Button asChild>
                <Link to="/dashboard/marketplace">
                  Explorar Marketplace
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <Card key={purchase.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center shrink-0">
                      {purchase.marketplace_items?.image_url ? (
                        <img 
                          src={purchase.marketplace_items.image_url} 
                          alt={purchase.item_name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{purchase.item_name}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(purchase.purchased_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </div>
                            <div className="flex items-center gap-1">
                              <Coins className="h-4 w-4" />
                              {purchase.price_coins} moedas
                            </div>
                            {purchase.quantity > 1 && (
                              <span>Qtd: {purchase.quantity}</span>
                            )}
                          </div>
                        </div>
                        
                        <Badge 
                          variant={purchase.status === 'completed' ? 'default' : 'secondary'}
                        >
                          {purchase.status === 'completed' ? 'Concluída' : 'Reembolsada'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};