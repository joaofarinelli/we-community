import { useState, useEffect } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MessageCircle, ExternalLink } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export const WhatsAppSection = () => {
  const { data: company } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState({
    whatsapp_enabled: company?.whatsapp_enabled || false,
    whatsapp_phone: company?.whatsapp_phone || '',
    whatsapp_message: company?.whatsapp_message || 'Olá! Gostaria de saber mais informações.',
  });

  // Update local state when company data changes
  useEffect(() => {
    if (company) {
      setConfig({
        whatsapp_enabled: company.whatsapp_enabled || false,
        whatsapp_phone: company.whatsapp_phone || '',
        whatsapp_message: company.whatsapp_message || 'Olá! Gostaria de saber mais informações.',
      });
    }
  }, [company]);

  const handleSave = async () => {
    if (!company?.id) return;

    // Validate phone number if enabled
    if (config.whatsapp_enabled && !config.whatsapp_phone.trim()) {
      toast({
        title: "Erro",
        description: "Número do WhatsApp é obrigatório quando o ícone está ativado",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          whatsapp_enabled: config.whatsapp_enabled,
          whatsapp_phone: config.whatsapp_phone.trim(),
          whatsapp_message: config.whatsapp_message.trim(),
        })
        .eq('id', company.id);

      if (error) throw error;

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });

      toast({
        title: "Sucesso",
        description: "Configurações do WhatsApp salvas com sucesso",
      });
    } catch (error) {
      console.error('Error saving WhatsApp config:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações do WhatsApp",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestWhatsApp = () => {
    if (!config.whatsapp_phone.trim()) {
      toast({
        title: "Erro",
        description: "Adicione um número de WhatsApp primeiro",
        variant: "destructive",
      });
      return;
    }

    const phone = config.whatsapp_phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(config.whatsapp_message.trim() || 'Teste de configuração');
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Ativar ícone flutuante do WhatsApp</Label>
            <p className="text-sm text-muted-foreground">
              Exibe um botão flutuante em todas as páginas para contato direto
            </p>
          </div>
          <Switch
            checked={config.whatsapp_enabled}
            onCheckedChange={(checked) => 
              setConfig(prev => ({ ...prev, whatsapp_enabled: checked }))
            }
          />
        </div>

        {config.whatsapp_enabled && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp-phone">
                Número do WhatsApp *
              </Label>
              <Input
                id="whatsapp-phone"
                placeholder="Ex: 5511999999999"
                value={config.whatsapp_phone}
                onChange={(e) => 
                  setConfig(prev => ({ ...prev, whatsapp_phone: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Digite o número com código do país (ex: 55 para Brasil)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp-message">
                Mensagem padrão
              </Label>
              <Textarea
                id="whatsapp-message"
                placeholder="Mensagem que será enviada automaticamente"
                value={config.whatsapp_message}
                onChange={(e) => 
                  setConfig(prev => ({ ...prev, whatsapp_message: e.target.value }))
                }
                rows={3}
              />
            </div>

            <Button
              variant="outline"
              onClick={handleTestWhatsApp}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Testar WhatsApp
            </Button>
          </div>
        )}

        <Button 
          onClick={handleSave} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </CardContent>
    </Card>
  );
};