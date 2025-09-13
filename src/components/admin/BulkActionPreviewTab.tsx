import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Megaphone, GraduationCap, Users, Clock, Play, AlertTriangle, CheckCircle } from 'lucide-react';
import { useBulkActionTargets, useBulkActionPreview, type BulkAction } from '@/hooks/useBulkActionsNew';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BulkActionPreviewTabProps {
  actionType: BulkAction['action_type'];
  actionConfig: any;
  audienceConfig: any;
}

const actionTypeConfig = {
  notification: {
    icon: Bell,
    label: 'Notificação',
    color: 'bg-blue-100 text-blue-800',
  },
  announcement: {
    icon: Megaphone,
    label: 'Anúncio',
    color: 'bg-orange-100 text-orange-800',
  },
  course_access: {
    icon: GraduationCap,
    label: 'Acesso ao Curso',
    color: 'bg-green-100 text-green-800',
  },
  space_access: {
    icon: Users,
    label: 'Acesso ao Espaço',
    color: 'bg-purple-100 text-purple-800',
  },
};

export function BulkActionPreviewTab({
  actionType,
  actionConfig,
  audienceConfig,
}: BulkActionPreviewTabProps) {
  const { data: targets = [], isLoading: targetsLoading } = useBulkActionTargets(audienceConfig);
  const previewMutation = useBulkActionPreview();

  const config = actionTypeConfig[actionType];
  const Icon = config?.icon || Bell;

  const handleGetPreview = async () => {
    try {
      await previewMutation.mutateAsync(audienceConfig);
    } catch (error) {
      console.error('Error getting preview:', error);
    }
  };

  const renderActionPreview = () => {
    if (!actionType || !actionConfig) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Configure a ação para ver a prévia
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    switch (actionType) {
      case 'notification':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-lg">Prévia da Notificação</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-semibold mb-2">{actionConfig.title || 'Título da notificação'}</h4>
                <p className="text-sm text-muted-foreground">
                  {actionConfig.content || 'Conteúdo da notificação aparecerá aqui...'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Enviada em {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 'announcement':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Megaphone className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-lg">Prévia do Anúncio</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-muted/50">
                {actionConfig.imageUrl && (
                  <img 
                    src={actionConfig.imageUrl} 
                    alt="Imagem do anúncio" 
                    className="w-full max-h-64 object-cover rounded-lg mb-4"
                  />
                )}
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{actionConfig.title || 'Título do anúncio'}</h4>
                  <div className="flex gap-1">
                    {actionConfig.isMandatory && (
                      <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                    )}
                    {actionConfig.expiresAt && (
                      <Badge variant="outline" className="text-xs">
                        Expira em {format(new Date(actionConfig.expiresAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {actionConfig.content || 'Conteúdo do anúncio aparecerá aqui...'}
                </p>
                <div className="flex gap-2">
                  {actionConfig.isMandatory ? (
                    <>
                      <Button size="sm" variant="outline">Dispensar</Button>
                      <Button size="sm">Aceitar</Button>
                    </>
                  ) : (
                    <Button size="sm">Entendi</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'course_access':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-lg">Acesso ao Curso</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Acesso concedido</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Os usuários selecionados receberão acesso ao curso selecionado.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 'space_access':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-lg">Acesso ao Espaço</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Acesso concedido</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Os usuários selecionados serão adicionados ao espaço selecionado.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {renderActionPreview()}

      <Card>
        <CardHeader>
          <CardTitle>Público-Alvo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="font-medium">
                {targetsLoading ? 'Carregando...' : `${targets.length} usuários selecionados`}
              </span>
            </div>
            <Button 
              onClick={handleGetPreview} 
              variant="outline" 
              size="sm"
              disabled={previewMutation.isPending}
            >
              <Clock className="h-4 w-4 mr-2" />
              Calcular Tempo
            </Button>
          </div>

          {(previewMutation as any).data && (
            <div className="bg-muted/50 rounded-lg p-3 mb-4">
              <p className="text-sm">
                <strong>Tempo estimado:</strong> {Math.ceil(((previewMutation as any).data as any)?.estimated_processing_time || 0)} segundos
              </p>
            </div>
          )}

          <ScrollArea className="h-48 border rounded-lg">
            <div className="p-3">
              {targetsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : targets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum usuário selecionado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {targets.map((target) => (
                    <div key={target.user_id} className="flex items-center justify-between p-2 rounded hover:bg-accent">
                      <div>
                        <p className="text-sm font-medium">
                          {target.first_name} {target.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{target.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}