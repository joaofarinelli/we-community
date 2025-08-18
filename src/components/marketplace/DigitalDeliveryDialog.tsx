import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface DigitalDeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  deliveryUrl: string;
}

export const DigitalDeliveryDialog = ({ 
  open, 
  onOpenChange, 
  productName, 
  deliveryUrl 
}: DigitalDeliveryDialogProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(deliveryUrl);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para sua área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  const handleOpenLink = () => {
    window.open(deliveryUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Compra Realizada com Sucesso!
          </DialogTitle>
          <DialogDescription>
            Seu produto digital está pronto para download
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Download className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-medium text-green-800">{productName}</h3>
                  <p className="text-sm text-green-600">Produto digital adquirido</p>
                </div>
              </div>
              
              <p className="text-sm text-green-700 mb-3">
                Seu produto está disponível através do link abaixo. Clique para acessar ou copie o link para usar posteriormente.
              </p>
              
              <div className="bg-white border border-green-200 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">Link de acesso:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted px-2 py-1 rounded truncate">
                    {deliveryUrl}
                  </code>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {copied ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Fechar
            </Button>
            <Button 
              onClick={handleOpenLink}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Acessar Produto
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Guarde este link com segurança. Você pode acessá-lo a qualquer momento através do histórico de compras.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};