import { useState } from 'react';
import * as React from 'react';
import { SuperAdminLayout } from '@/components/super-admin/SuperAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Bug, Mail, Save, CheckCircle } from 'lucide-react';
import { useBugReportsConfig, useUpdateSuperAdminConfig } from '@/hooks/useSuperAdminConfigs';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const SuperAdminBugReportsConfig = () => {
  const { data: config, isLoading } = useBugReportsConfig();
  const { mutate: updateConfig, isPending } = useUpdateSuperAdminConfig();
  
  const [email, setEmail] = useState('');
  const [enabled, setEnabled] = useState(true);
  
  // Update local state when config loads
  React.useEffect(() => {
    if (config?.config_value) {
      setEmail(config.config_value.email || '');
      setEnabled(config.config_value.enabled !== false);
    }
  }, [config]);

  const handleSave = () => {
    updateConfig({
      configKey: 'bug_reports',
      configValue: {
        email: email.trim() || null,
        enabled: enabled
      },
      description: 'Configurações para relatórios de bugs - email de destino e status de ativação'
    });
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const hasChanges = config ? (
    email !== (config.config_value?.email || '') ||
    enabled !== (config.config_value?.enabled !== false)
  ) : false;

  if (isLoading) {
    return (
      <SuperAdminLayout>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-80" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-6 w-32" />
            </CardContent>
          </Card>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Bug className="h-8 w-8" />
            Configuração de Bug Reports
          </h1>
          <p className="text-muted-foreground">
            Configure o email de destino para recebimento dos relatórios de bugs enviados pelos usuários.
          </p>
        </div>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email de Destino
            </CardTitle>
            <CardDescription>
              Defina o endereço de email que receberá todos os relatórios de bugs do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="bug-email">Email para Bug Reports</Label>
              <Input
                id="bug-email"
                type="email"
                placeholder="exemplo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={email && !isValidEmail(email) ? "border-destructive" : ""}
              />
              {email && !isValidEmail(email) && (
                <p className="text-sm text-destructive">
                  Por favor, insira um email válido
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Deixe em branco para desabilitar o envio de emails
              </p>
            </div>

            <Separator />

            {/* Enable/Disable Switch */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="bug-enabled">Sistema de Bug Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Habilita ou desabilita completamente o sistema de relatórios de bugs
                </p>
              </div>
              <Switch
                id="bug-enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>

            {/* Current Status */}
            <Separator />
            
            <div className="space-y-3">
              <Label>Status Atual</Label>
              <div className="space-y-2">
                <Alert className={enabled ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Sistema:</strong> {enabled ? 'Ativado' : 'Desativado'}
                  </AlertDescription>
                </Alert>
                
                {email ? (
                  <Alert className="border-blue-200 bg-blue-50">
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Email configurado:</strong> {email}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Nenhum email configurado</strong> - Os relatórios serão salvos apenas no banco de dados
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSave}
                disabled={isPending || !hasChanges || (email && !isValidEmail(email))}
                className="gap-2"
              >
                {isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Como Funciona
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Quando um usuário reporta um bug através do sistema, o relatório é salvo no banco de dados.</p>
              <p>• Se um email estiver configurado aqui, uma cópia formatada do relatório será enviada automaticamente.</p>
              <p>• O email incluirá detalhes como título, descrição, categoria, prioridade, informações do usuário e dados técnicos.</p>
              <p>• Você pode desabilitar temporariamente o sistema sem perder as configurações de email.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};