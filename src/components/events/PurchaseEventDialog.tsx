import { useState } from 'react';
import { ExternalLink, Coins, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useEventPayment } from '@/hooks/useEventPayment';
import { useCoinName } from '@/hooks/useCoinName';
import { toast } from 'sonner';

interface PurchaseEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    id: string;
    title: string;
    price_coins?: number;
    external_payment_url?: string;
  };
  onSuccess?: () => void;
}

export const PurchaseEventDialog = ({ 
  open, 
  onOpenChange, 
  event, 
  onSuccess 
}: PurchaseEventDialogProps) => {
  const { processPayment, requestExternalPayment, userCoins } = useEventPayment();
  const { data: coinName } = useCoinName();
  const [selectedMethod, setSelectedMethod] = useState<'coins' | 'external' | null>(null);

  const priceCoins = event.price_coins || 0;
  const hasExternalPayment = !!event.external_payment_url;
  const hasInsufficientCoins = userCoins < priceCoins;

  const handlePurchase = async () => {
    if (!selectedMethod) {
      toast.error('Selecione um método de pagamento');
      return;
    }

    try {
      if (selectedMethod === 'coins') {
        await processPayment.mutateAsync({
          eventId: event.id,
          priceCoins,
          eventTitle: event.title,
        });
        toast.success('Pagamento realizado com sucesso!');
        onSuccess?.();
        onOpenChange(false);
      } else if (selectedMethod === 'external') {
        await requestExternalPayment.mutateAsync({
          eventId: event.id,
          eventTitle: event.title,
        });
        toast.success('Solicitação de pagamento registrada! Aguarde a aprovação do administrador.');
        
        // Open external payment link if available
        if (event.external_payment_url) {
          window.open(event.external_payment_url, '_blank');
        }
        
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar pagamento');
    }
  };

  const isLoading = processPayment.isPending || requestExternalPayment.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Comprar Acesso ao Evento</DialogTitle>
          <DialogDescription>
            Escolha como deseja pagar pelo evento "{event.title}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold">{priceCoins} {coinName}</p>
            <p className="text-sm text-muted-foreground">Preço do evento</p>
          </div>

          <div className="space-y-3">
            {/* Coins Payment Option */}
            {priceCoins > 0 && (
              <Card 
                className={`cursor-pointer transition-colors ${
                  selectedMethod === 'coins' 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-gray-50'
                } ${hasInsufficientCoins ? 'opacity-50' : ''}`}
                onClick={() => !hasInsufficientCoins && setSelectedMethod('coins')}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    Pagar com {coinName}
                    {hasInsufficientCoins && (
                      <Badge variant="destructive" className="text-xs">
                        Saldo insuficiente
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Seu saldo: {userCoins} {coinName}
                      </p>
                      {hasInsufficientCoins && (
                        <p className="text-xs text-red-600">
                          Faltam {priceCoins - userCoins} {coinName}
                        </p>
                      )}
                    </div>
                    {!hasInsufficientCoins && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Disponível
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* External Payment Option */}
            {hasExternalPayment && (
              <Card 
                className={`cursor-pointer transition-colors ${
                  selectedMethod === 'external' 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedMethod('external')}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Pagamento Externo
                    <Badge variant="outline" className="text-xs">
                      Aprovação necessária
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    Pague através de link externo e aguarde aprovação do administrador
                  </p>
                  {event.external_payment_url && (
                    <div className="flex items-center gap-1 mt-2">
                      <ExternalLink className="h-3 w-3" />
                      <span className="text-xs text-blue-600">Link será aberto automaticamente</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Show fallback external option if no URL is configured */}
            {!hasExternalPayment && (hasInsufficientCoins || priceCoins === 0) && (
              <Card 
                className={`cursor-pointer transition-colors ${
                  selectedMethod === 'external' 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedMethod('external')}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Solicitar Pagamento Externo
                    <Badge variant="outline" className="text-xs">
                      Aprovação necessária
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    Solicite aprovação do administrador para participar do evento
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {selectedMethod && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium">Resumo do Pagamento</h4>
                <div className="flex justify-between text-sm">
                  <span>Evento:</span>
                  <span>{event.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Método:</span>
                  <span>
                    {selectedMethod === 'coins' ? `${coinName}` : 'Pagamento Externo'}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Total:</span>
                  <span>{priceCoins} {coinName}</span>
                </div>
                
                {selectedMethod === 'external' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">Atenção:</p>
                        <p>Após confirmar, você será adicionado ao evento com status "Pagamento Pendente". O acesso só será liberado após aprovação do administrador.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handlePurchase}
              disabled={!selectedMethod || isLoading || (selectedMethod === 'coins' && hasInsufficientCoins)}
              className="flex-1"
            >
              {isLoading ? 'Processando...' : 
               selectedMethod === 'coins' ? 'Pagar Agora' : 'Solicitar Pagamento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};