import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save } from 'lucide-react';
import { useBulkActionsNew, type BulkAction } from '@/hooks/useBulkActionsNew';
import { BulkActionConfigTab } from '@/components/admin/BulkActionConfigTab';
import { BulkActionAudienceTab } from '@/components/admin/BulkActionAudienceTab';
import { BulkActionPreviewTab } from '@/components/admin/BulkActionPreviewTab';
import { toast } from '@/hooks/use-toast';

export function BulkActionCreateEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const { bulkActions, createBulkAction, updateBulkAction } = useBulkActionsNew();
  
  const [formData, setFormData] = useState<Partial<BulkAction>>({
    name: '',
    description: '',
    action_type: 'notification',
    action_config: {},
    audience_config: { filters: {} },
    is_active: true,
  });

  const [activeTab, setActiveTab] = useState('config');

  useEffect(() => {
    if (isEditing && bulkActions.length > 0) {
      const existingAction = bulkActions.find(action => action.id === id);
      if (existingAction) {
        setFormData(existingAction);
      }
    }
  }, [isEditing, id, bulkActions]);

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe um nome para a ação.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.action_type) {
      toast({
        title: 'Tipo de ação obrigatório',
        description: 'Por favor, configure o tipo de ação.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isEditing) {
        await updateBulkAction.mutateAsync({ id: id!, ...formData });
      } else {
        await createBulkAction.mutateAsync(formData as Omit<BulkAction, 'id' | 'created_at' | 'updated_at' | 'created_by'>);
      }
      navigate('/admin/bulk-actions');
    } catch (error) {
      console.error('Error saving bulk action:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/bulk-actions')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">
              {isEditing ? 'Editar Ação em Massa' : 'Nova Ação em Massa'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Modifique os detalhes da ação em massa.' : 'Configure uma nova ação em massa para seus usuários.'}
            </p>
          </div>
          <Button onClick={handleSave} disabled={createBulkAction.isPending || updateBulkAction.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? 'Salvar Alterações' : 'Criar Ação'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Detalhes Básicos</CardTitle>
              <Badge variant={formData.is_active ? 'default' : 'secondary'}>
                {formData.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Ação *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Notificar novos membros"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="is_active">Status</Label>
                <select
                  id="is_active"
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  value={formData.is_active ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o que esta ação faz..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="audience">Público</TabsTrigger>
            <TabsTrigger value="preview">Prévia</TabsTrigger>
          </TabsList>
          
          <TabsContent value="config" className="space-y-4">
            <BulkActionConfigTab 
              actionType={formData.action_type!}
              actionConfig={formData.action_config || {}}
              onActionTypeChange={(type) => setFormData({ ...formData, action_type: type, action_config: {} })}
              onActionConfigChange={(config) => setFormData({ ...formData, action_config: config })}
            />
          </TabsContent>
          
          <TabsContent value="audience" className="space-y-4">
            <BulkActionAudienceTab
              audienceConfig={formData.audience_config || { filters: {} }}
              onAudienceConfigChange={(config) => setFormData({ ...formData, audience_config: config })}
            />
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <BulkActionPreviewTab
              actionType={formData.action_type!}
              actionConfig={formData.action_config || {}}
              audienceConfig={formData.audience_config || { filters: {} }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}