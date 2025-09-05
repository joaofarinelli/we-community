import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCustomDomain } from '@/hooks/useCustomDomain';
import { useCompany } from '@/hooks/useCompany';
import { Loader2, Globe, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

export const CustomDomainSection = () => {
  const { data: company } = useCompany();
  const {
    updateCustomDomain,
    removeCustomDomain,
    verifyDomain,
    getDnsRecords,
    isVerifying,
    customDomain,
    customDomainStatus,
    customDomainVerifiedAt
  } = useCustomDomain();

  const [domainInput, setDomainInput] = useState(customDomain || '');

  // Get current domain being used
  const currentDomain = window.location.hostname;
  const isUsingCustomDomain = customDomain && (currentDomain === customDomain);
  const isUsingSubdomain = currentDomain.includes('weplataforma.com.br');

  const getCurrentDomainStatus = () => {
    if (isUsingCustomDomain) {
      switch (customDomainStatus) {
        case 'verified':
          return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Domínio Personalizado</Badge>;
        case 'pending':
          return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Pendente</Badge>;
        case 'failed':
          return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Falhou</Badge>;
        default:
          return <Badge variant="outline">Domínio Personalizado</Badge>;
      }
    } else if (isUsingSubdomain) {
      return <Badge variant="outline">Subdomínio</Badge>;
    } else {
      return <Badge variant="outline">Domínio</Badge>;
    }
  };

  const handleUpdateDomain = () => {
    if (!domainInput.trim()) return;
    updateCustomDomain.mutate({ domain: domainInput.trim() });
  };

  const handleRemoveDomain = () => {
    removeCustomDomain.mutate();
    setDomainInput('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  const getStatusBadge = () => {
    switch (customDomainStatus) {
      case 'verified':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Verificado</Badge>;
      case 'pending':
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Falhou</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Domínio Personalizado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Domain Being Used */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="current-domain">Domínio em uso agora</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="current-domain"
                value={currentDomain}
                disabled
                className="bg-muted font-mono"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(currentDomain)}
                className="h-10 px-3"
              >
                <Copy className="w-4 h-4" />
              </Button>
              {getCurrentDomainStatus()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isUsingCustomDomain 
                ? 'Você está usando seu domínio personalizado'
                : isUsingSubdomain 
                  ? 'Você está usando o subdomínio padrão da plataforma'
                  : 'Domínio atual em uso'
              }
            </p>
          </div>

          <Separator />
        </div>

        {/* Subdomain section - only show if no verified custom domain */}
        {customDomainStatus !== 'verified' && (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subdomain">Subdomínio Atual</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={`${company?.subdomain}.weplataforma.com.br`}
                    disabled
                    className="bg-muted"
                  />
                  <Badge variant="outline">Ativo</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Este é o seu domínio padrão que sempre funcionará
                </p>
              </div>

              <Separator />
            </div>
          </>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="custom-domain">Domínio Personalizado</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="custom-domain"
                placeholder="ex: minhaempresa.com.br"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                disabled={updateCustomDomain.isPending}
              />
              {customDomain && getStatusBadge()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Configure seu próprio domínio para acessar a plataforma
            </p>
          </div>

          <div className="flex gap-2">
            {!customDomain ? (
              <Button
                onClick={handleUpdateDomain}
                disabled={!domainInput.trim() || updateCustomDomain.isPending}
                className="flex items-center gap-2"
              >
                {updateCustomDomain.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Configurar Domínio
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleUpdateDomain}
                  disabled={!domainInput.trim() || updateCustomDomain.isPending || domainInput === customDomain}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {updateCustomDomain.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Atualizar
                </Button>
                {customDomainStatus === 'pending' && (
                  <Button
                    onClick={verifyDomain}
                    disabled={isVerifying}
                    className="flex items-center gap-2"
                  >
                    {isVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
                    Verificar
                  </Button>
                )}
                <Button
                  onClick={handleRemoveDomain}
                  disabled={removeCustomDomain.isPending}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  {removeCustomDomain.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Remover
                </Button>
              </>
            )}
          </div>

          {customDomain && customDomainStatus === 'pending' && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">Configuração DNS Necessária</h4>
                <p className="text-sm text-muted-foreground">
                  Adicione os seguintes registros DNS no seu provedor de domínio:
                </p>
                
                <div className="space-y-3">
                  {getDnsRecords().map((record, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-sm">
                          <Badge variant="outline" className="mr-2">{record.type}</Badge>
                          <span className="font-semibold">{record.name}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(record.value)}
                          className="h-6 px-2"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="font-mono text-sm bg-background px-2 py-1 rounded border">
                        {record.value}
                      </div>
                      <p className="text-xs text-muted-foreground">{record.description}</p>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground">
                  Após configurar os registros DNS, clique em "Verificar" para ativar o domínio personalizado.
                  A propagação pode levar até 48 horas.
                </p>
              </div>
            </>
          )}

          {customDomainStatus === 'verified' && customDomainVerifiedAt && (
            <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Domínio verificado e ativo!</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                Verificado em {new Date(customDomainVerifiedAt).toLocaleString('pt-BR')}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};