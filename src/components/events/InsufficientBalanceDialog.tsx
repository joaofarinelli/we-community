import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Calendar, MapPin, Users, AlertCircle, MessageCircle, CreditCard } from 'lucide-react';
import { useCoinName } from '@/hooks/useCoinName';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';
import { usePaymentProviderConfig } from '@/hooks/usePaymentProvider';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InsufficientBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    location?: string;
    price_coins?: number;
    max_participants?: number;
  };
  userCoins: number;
  onOpenCoinTopup: () => void;
}

export const InsufficientBalanceDialog = ({ 
  open, 
  onOpenChange, 
  event,
  userCoins,
  onOpenCoinTopup
}: InsufficientBalanceDialogProps) => {
  const { data: coinName } = useCoinName();
  const { data: whatsappConfig } = useWhatsAppConfig();
  const { data: paymentConfig } = usePaymentProviderConfig();
  
  const priceCoins = event.price_coins || 0;
  const coinsNeeded = priceCoins - userCoins;
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);

  const handleWhatsAppClick = () => {
    if (!whatsappConfig?.whatsapp_enabled || !whatsappConfig?.whatsapp_phone) return;
    
    const phone = whatsappConfig.whatsapp_phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Olá! Gostaria de comprar ${coinsNeeded} ${coinName} para participar do evento "${event.title}". Como posso adquirir mais moedas?`
    );
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onOpenChange(false);
  };

  const handleCoinTopup = () => {
    onOpenChange(false);
    onOpenCoinTopup();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Saldo insuficiente
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Event Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">{event.title}</h3>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(startDate, "d 'de' MMMM", { locale: ptBR })} - {format(startDate, 'HH:mm')} às {format(endDate, 'HH:mm')}
                </span>
              </div>
              
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
              )}
              
              {event.max_participants && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Máximo de {event.max_participants} participantes</span>
                </div>
              )}
            </div>
          </div>

          {/* Balance Information */}
          <div className="space-y-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Preço do evento:</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold">
                {priceCoins} {coinName}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Seu saldo atual:</span>
              <span className="font-medium text-destructive">
                {userCoins} {coinName}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-destructive/20 pt-3">
              <span className="font-medium text-destructive">Você precisa de:</span>
              <Badge variant="destructive" className="font-semibold">
                +{coinsNeeded} {coinName}
              </Badge>
            </div>
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Escolha uma opção abaixo para adquirir mais {coinName} e participar do evento:</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-3">
          {/* Payment option (if available) */}
          {paymentConfig && (
            <Button
              onClick={handleCoinTopup}
              className="w-full"
              size="lg"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Comprar {coinName} (Boleto)
            </Button>
          )}

          {/* WhatsApp option */}
          {whatsappConfig?.whatsapp_enabled && whatsappConfig?.whatsapp_phone && (
            <Button
              onClick={handleWhatsAppClick}
              variant="outline"
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white border-[#25D366] hover:border-[#128C7E]"
              size="lg"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Falar no WhatsApp
            </Button>
          )}

          {/* Cancel button */}
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};