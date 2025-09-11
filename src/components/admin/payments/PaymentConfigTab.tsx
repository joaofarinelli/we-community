import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePaymentProviderConfig, useCreateOrUpdatePaymentConfig } from '@/hooks/usePaymentProvider';
import { AlertCircle, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const PaymentConfigTab = () => {
  const { data: config, isLoading } = usePaymentProviderConfig();
  const updateConfig = useCreateOrUpdatePaymentConfig();

  const [environment, setEnvironment] = useState(config?.environment || 'sandbox');
  const [apiKey, setApiKey] = useState(config?.credentials?.api_key || '');
  const [apiSecret, setApiSecret] = useState(config?.credentials?.api_secret || '');
  const [webhookSecret, setWebhookSecret] = useState(config?.webhook_secret || '');
  const [coinsPerBrl, setCoinsPerBrl] = useState(config?.coins_per_brl || 1.0);
  const [isActive, setIsActive] = useState(config?.is_active || false);

  const handleSave = async () => {
    try {
      await updateConfig.mutateAsync({
        environment,
        credentials: {
          api_key: apiKey,
          api_secret: apiSecret,
        },
        webhook_secret: webhookSecret,
        coins_per_brl: Number(coinsPerBrl),
      });
    } catch (error) {
      // Error handled by the mutation
    }
  };

  const isConfigComplete = apiKey.trim() && apiSecret.trim();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuração TMB Educação</CardTitle>
          <CardDescription>
            Configure as credenciais do TMB Educação para processar pagamentos via boleto bancário.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="environment">Ambiente</Label>
              <Select value={environment} onValueChange={setEnvironment}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ambiente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                  <SelectItem value="production">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coins-per-brl">Moedas por R$ 1,00</Label>
              <Input
                id="coins-per-brl"
                type="number"
                step="0.01"
                min="0.01"
                value={coinsPerBrl}
                onChange={(e) => setCoinsPerBrl(Number(e.target.value))}
                placeholder="1.00"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Sua chave de API do TMB Educação"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-secret">API Secret</Label>
              <Input
                id="api-secret"
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Seu secret da API do TMB Educação"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-secret">Webhook Secret (Opcional)</Label>
              <Input
                id="webhook-secret"
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="Secret para validar webhooks"
              />
            </div>
          </div>

          {!isConfigComplete && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configure a API Key e API Secret para habilitar pagamentos via boleto.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={!isConfigComplete}
              />
              <Label htmlFor="is-active">Habilitar pagamentos via boleto</Label>
            </div>

            <Button
              onClick={handleSave}
              disabled={!isConfigComplete || updateConfig.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateConfig.isPending ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instruções de Configuração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">1. Obtenha suas credenciais</h4>
              <p className="text-muted-foreground">
                Acesse sua conta no TMB Educação e obtenha suas credenciais de API (API Key e API Secret).
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. Configure o ambiente</h4>
              <p className="text-muted-foreground">
                Use "Sandbox" para testes e "Produção" quando estiver pronto para aceitar pagamentos reais.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. Defina a conversão de moedas</h4>
              <p className="text-muted-foreground">
                Configure quantas moedas o usuário recebe por cada R$ 1,00 pago via boleto.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">4. Teste a integração</h4>
              <p className="text-muted-foreground">
                Após salvar, teste gerando um boleto no ambiente sandbox antes de ativar em produção.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};