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
import { DigitalDeliveryDialog } from './DigitalDeliveryDialog';
import { usePaymentProviderConfig, useCreateBoleto } from '@/hooks/usePaymentProvider';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { BoletoDialog } from '@/components/payments/BoletoDialog';
import { Separator } from '@/components/ui/separator';

interface MarketplaceItem {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price_coins: number;
  stock_quantity: number | null;
  item_type?: string;
  digital_delivery_url?: string;
}

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MarketplaceItem;
  userCoins: number;
}

export const PurchaseDialog = ({ open, onOpenChange, item, userCoins }: PurchaseDialogProps) => {
  const purchaseItem = usePurchaseItem();
  const { currentCompanyId } = useCompanyContext();
  const { data: paymentConfig } = usePaymentProviderConfig();
  const createBoleto = useCreateBoleto();
  
  const [showDigitalDelivery, setShowDigitalDelivery] = useState(false);
  const [showBoletoDialog, setShowBoletoDialog] = useState(false);
  const [boletoPayment, setBoletoPayment] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'coins' | 'boleto'>('coins');
  const [payerName, setPayerName] = useState('');
  const [payerCpf, setPayerCpf] = useState('');

  const [delivery, setDelivery] = useState({
    address: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    postal_code: '',
  });
  
  const canAffordCoins = userCoins >= item.price_coins;
  const requiresDelivery = item.item_type !== 'digital';
  const isDeliveryValid = !requiresDelivery || (delivery.address && delivery.number && delivery.neighborhood && delivery.city && delivery.state && delivery.postal_code);
  const canPurchase = paymentMethod === 'coins' ? canAffordCoins && isDeliveryValid : payerName.trim() && payerCpf.trim() && isDeliveryValid;
  const hasBoletoOption = !!paymentConfig?.is_active;

  const onClose = () => onOpenChange(false);

  const handlePurchase = async () => {
    if (!canPurchase) return;

    const deliveryData = {
      address: delivery.address,
      number: delivery.number,
      neighborhood: delivery.neighborhood,
      city: delivery.city,
      state: delivery.state,
      postal_code: delivery.postal_code,
    };

    if (paymentMethod === 'coins') {
      try {
        const result = await purchaseItem.mutateAsync({
          itemId: item.id,
          quantity: 1,
          delivery: deliveryData,
        });

        onClose();
        
        // Se for produto digital e tiver link de entrega, abrir dialog de entrega
        if (item.item_type === 'digital' && item.digital_delivery_url) {
          setShowDigitalDelivery(true);
        }
      } catch (error) {
        // Error handling is done in the mutation
      }
    } else if (paymentMethod === 'boleto') {
      try {
        const boletoData = await createBoleto.mutateAsync({
          companyId: currentCompanyId!,
          purposeType: 'marketplace_item',
          referenceId: item.id,
          amountCents: item.price_coins * 100, // Convert coins to cents (1:1 ratio)
          payerData: {
            name: payerName,
            cpf: payerCpf,
            address: requiresDelivery ? {
              street: delivery.address,
              number: delivery.number,
              neighborhood: delivery.neighborhood,
              city: delivery.city,
              state: delivery.state,
              postal_code: delivery.postal_code,
            } : undefined
          },
          metadata: {
            quantity: 1,
            delivery: deliveryData
          }
        });

        setBoletoPayment(boletoData.payment);
        setShowBoletoDialog(true);
      } catch (error) {
        // Error handling is done in the mutation
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Compra</DialogTitle>
          <DialogDescription>
            Escolha a forma de pagamento para este item.
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
            <div className="flex items-center justify-between py-3">
              <span className="font-medium">Preço:</span>
              <span className="text-lg font-semibold text-primary">
                {paymentMethod === 'coins' 
                  ? `${item.price_coins} moedas`
                  : `R$ ${(item.price_coins * 1.00).toFixed(2)}`
                }
              </span>
            </div>
            
            {paymentMethod === 'coins' && (
              <div className="flex items-center justify-between py-3">
                <span className="font-medium">Seu saldo:</span>
                <span className={`text-lg font-semibold ${canAffordCoins ? 'text-green-600' : 'text-red-600'}`}>
                  {userCoins} moedas
                </span>
              </div>
            )}

            {hasBoletoOption && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Forma de Pagamento</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('coins')}
                      className={`p-3 border rounded-lg text-center transition-colors ${
                        paymentMethod === 'coins'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium">Moedas</div>
                      <div className="text-xs text-muted-foreground">Usar saldo</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('boleto')}
                      className={`p-3 border rounded-lg text-center transition-colors ${
                        paymentMethod === 'boleto'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium">Boleto</div>
                      <div className="text-xs text-muted-foreground">Pagamento bancário</div>
                    </button>
                  </div>
                </div>
              </>
            )}

            {paymentMethod === 'boleto' && (
              <>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Dados do Pagador</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="payer-name">Nome Completo</Label>
                      <Input
                        id="payer-name"
                        value={payerName}
                        onChange={(e) => setPayerName(e.target.value)}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payer-cpf">CPF</Label>
                      <Input
                        id="payer-cpf"
                        value={payerCpf}
                        onChange={(e) => setPayerCpf(e.target.value)}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
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
                    maxLength={9}
                    onChange={async (e) => {
                      // Format CEP as user types
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 5) {
                        value = value.replace(/^(\d{5})(\d)/, '$1-$2');
                      }
                      setDelivery({ ...delivery, postal_code: value });
                      
                      // Auto-fill address when CEP is complete
                      if (value.replace(/\D/g, '').length === 8) {
                        try {
                          const cleanCep = value.replace(/\D/g, '');
                          const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                          const data = await response.json();
                          
                          if (data && !data.erro) {
                            setDelivery(prev => ({
                              ...prev,
                              address: data.logradouro || '',
                              neighborhood: data.bairro || '',
                              city: data.localidade || '',
                              state: data.uf || ''
                            }));
                          }
                        } catch (error) {
                          console.error('Erro ao buscar CEP:', error);
                        }
                      }
                    }}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={purchaseItem.isPending || createBoleto.isPending}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handlePurchase}
            disabled={!canPurchase || purchaseItem.isPending || createBoleto.isPending}
          >
            {(purchaseItem.isPending || createBoleto.isPending) 
              ? 'Processando...' 
              : paymentMethod === 'coins' 
                ? 'Confirmar Compra' 
                : 'Gerar Boleto'
            }
          </Button>
        </DialogFooter>
        
        {paymentMethod === 'coins' && !canAffordCoins && (
          <p className="text-sm text-destructive text-center mt-2">
            Saldo insuficiente para esta compra
          </p>
        )}
        
        {paymentMethod === 'boleto' && (!payerName.trim() || !payerCpf.trim()) && (
          <p className="text-sm text-destructive text-center mt-2">
            Preencha nome e CPF para continuar
          </p>
        )}
      </DialogContent>
      
      <DigitalDeliveryDialog
        open={showDigitalDelivery}
        onOpenChange={setShowDigitalDelivery}
        productName={item.name}
        deliveryUrl={item.digital_delivery_url || ''}
      />

      {boletoPayment && (
        <BoletoDialog
          open={showBoletoDialog}
          onClose={() => {
            setShowBoletoDialog(false);
            setBoletoPayment(null);
            onClose();
          }}
          payment={boletoPayment}
          onPaymentConfirmed={() => {
            setShowBoletoDialog(false);
            setBoletoPayment(null);
            onClose();
          }}
        />
      )}
    </Dialog>
  );
};