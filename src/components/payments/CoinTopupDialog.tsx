import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateBoleto, usePaymentProviderConfig } from "@/hooks/usePaymentProvider";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { BoletoDialog } from "./BoletoDialog";
import { toast } from "sonner";
import { Coins } from "lucide-react";

interface CoinTopupDialogProps {
  open: boolean;
  onClose: () => void;
}

export const CoinTopupDialog = ({ open, onClose }: CoinTopupDialogProps) => {
  const [amount, setAmount] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerCpf, setPayerCpf] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [showBoletoDialog, setShowBoletoDialog] = useState(false);
  const [boletoPayment, setBoletoPayment] = useState<any>(null);

  const { currentCompanyId } = useCompanyContext();
  const { data: paymentConfig } = usePaymentProviderConfig();
  const createBoleto = useCreateBoleto();

  const handleTopup = async () => {
    if (!amount || !payerName.trim() || !payerCpf.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }

    try {
      const boletoData = await createBoleto.mutateAsync({
        companyId: currentCompanyId!,
        purposeType: 'coin_topup',
        amountCents: Math.round(amountValue * 100), // Convert BRL to cents
        payerData: {
          name: payerName,
          cpf: payerCpf,
          email: payerEmail || undefined,
        },
        metadata: {
          topup_amount_brl: amountValue,
          coins_to_receive: Math.floor(amountValue * (paymentConfig?.coins_per_brl || 1))
        }
      });

      setBoletoPayment(boletoData.payment);
      setShowBoletoDialog(true);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const expectedCoins = amount ? Math.floor(parseFloat(amount) * (paymentConfig?.coins_per_brl || 1)) : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Comprar Moedas</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Coins className="w-6 h-6 text-primary" />
                <span className="text-lg font-medium">Taxa de Conversão</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                1 BRL = {paymentConfig?.coins_per_brl || 1} moedas
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10.00"
                />
                {amount && (
                  <p className="text-sm text-muted-foreground">
                    Você receberá: <span className="font-medium text-primary">{expectedCoins} moedas</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payer-name">Nome Completo *</Label>
                <Input
                  id="payer-name"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payer-cpf">CPF *</Label>
                <Input
                  id="payer-cpf"
                  value={payerCpf}
                  onChange={(e) => setPayerCpf(e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payer-email">E-mail (opcional)</Label>
                <Input
                  id="payer-email"
                  type="email"
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={createBoleto.isPending}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleTopup}
                disabled={createBoleto.isPending || !amount || !payerName.trim() || !payerCpf.trim()}
                className="flex-1"
              >
                {createBoleto.isPending ? 'Gerando...' : 'Gerar Boleto'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  );
};