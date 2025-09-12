import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Settings } from 'lucide-react';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';

export const MaintenanceModeSection = () => {
  const { 
    isMaintenanceMode, 
    maintenanceMessage, 
    updateMaintenanceMode, 
    isUpdating 
  } = useMaintenanceMode();
  
  const [localMaintenanceMode, setLocalMaintenanceMode] = useState(isMaintenanceMode);
  const [localMessage, setLocalMessage] = useState(maintenanceMessage || '');

  const handleSave = () => {
    updateMaintenanceMode({
      maintenanceMode: localMaintenanceMode,
      message: localMessage.trim() || undefined
    });
  };

  const hasChanges = localMaintenanceMode !== isMaintenanceMode || 
                     localMessage !== (maintenanceMessage || '');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Modo de Manutenção
        </CardTitle>
        <CardDescription>
          Configure quando a plataforma deve estar em manutenção. Apenas administradores terão acesso quando ativo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="maintenance-mode"
            checked={localMaintenanceMode}
            onCheckedChange={setLocalMaintenanceMode}
          />
          <Label htmlFor="maintenance-mode" className="flex items-center gap-2">
            {localMaintenanceMode && <AlertTriangle className="h-4 w-4 text-warning" />}
            Ativar modo de manutenção
          </Label>
        </div>

        {localMaintenanceMode && (
          <div className="space-y-3 p-4 border border-warning/20 bg-warning/5 rounded-lg">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Atenção: Modo de manutenção ativo</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Quando ativado, apenas administradores e proprietários poderão acessar a plataforma. 
              Todos os outros usuários verão a página de manutenção.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Label htmlFor="maintenance-message">
            Mensagem de manutenção (opcional)
          </Label>
          <Textarea
            id="maintenance-message"
            placeholder="Digite uma mensagem personalizada que será exibida para os usuários durante a manutenção..."
            value={localMessage}
            onChange={(e) => setLocalMessage(e.target.value)}
            className="min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground">
            Deixe em branco para usar a mensagem padrão do sistema.
          </p>
        </div>

        {hasChanges && (
          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={handleSave} 
              disabled={isUpdating}
              className="w-full sm:w-auto"
            >
              {isUpdating ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};