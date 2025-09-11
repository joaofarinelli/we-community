import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useCheckPaymentStatus } from "@/hooks/usePaymentProvider";
import { useState } from "react";

interface BoletoDialogProps {
  open: boolean;
  onClose: () => void;
  payment: {
    id: string;
    boleto_url?: string;
    barcode?: string;
    linha_digitavel?: string;
    expiration?: string;
    amount_cents: number;
    status: string;
  };
  onPaymentConfirmed?: () => void;
}

export const BoletoDialog = ({ open, onClose, payment, onPaymentConfirmed }: BoletoDialogProps) => {
  const [isChecking, setIsChecking] = useState(false);
  const checkStatus = useCheckPaymentStatus();

  const handleCopyBarcode = () => {
    if (payment.barcode) {
      navigator.clipboard.writeText(payment.barcode);
      toast.success('Código de barras copiado!');
    }
  };

  const handleCopyLinhaDigitavel = () => {
    if (payment.linha_digitavel) {
      navigator.clipboard.writeText(payment.linha_digitavel);
      toast.success('Linha digitável copiada!');
    }
  };

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      const result = await checkStatus.mutateAsync(payment.id);
      if (result.payment.status === 'paid') {
        toast.success('Pagamento confirmado!');
        onPaymentConfirmed?.();
        onClose();
      } else if (result.payment.status === 'expired') {
        toast.error('Boleto vencido');
      } else if (result.payment.status === 'cancelled') {
        toast.error('Boleto cancelado');
      } else {
        toast.info('Pagamento ainda não confirmado');
      }
    } catch (error) {
      toast.error('Erro ao verificar status do pagamento');
    } finally {
      setIsChecking(false);
    }
  };

  const formatAmount = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Boleto Gerado</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Valor</p>
            <p className="text-2xl font-bold text-primary">
              {formatAmount(payment.amount_cents)}
            </p>
            {payment.expiration && (
              <p className="text-sm text-muted-foreground mt-2">
                Vencimento: {formatDate(payment.expiration)}
              </p>
            )}
          </div>

          {payment.status === 'pending' && (
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                ⏳ Aguardando pagamento
              </p>
            </div>
          )}

          {payment.status === 'paid' && (
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✅ Pagamento confirmado
              </p>
            </div>
          )}

          <div className="space-y-3">
            {payment.boleto_url && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(payment.boleto_url, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir Boleto
              </Button>
            )}

            {payment.linha_digitavel && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Linha Digitável:</label>
                <div className="flex gap-2">
                  <div className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
                    {payment.linha_digitavel}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLinhaDigitavel}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {payment.barcode && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Código de Barras:</label>
                <div className="flex gap-2">
                  <div className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
                    {payment.barcode}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyBarcode}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="flex-1"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              Verificar Status
            </Button>
            <Button onClick={onClose} className="flex-1">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};