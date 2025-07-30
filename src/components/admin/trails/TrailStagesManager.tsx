import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { useTrailStages, useCreateTrailStage, useUpdateTrailStage, useDeleteTrailStage } from '@/hooks/useTrailStages';


interface TrailStagesManagerProps {
  trailId?: string;
  templateId?: string;
  isReadOnly?: boolean;
}

interface StageFormData {
  name: string;
  description: string;
  guidance_text: string;
  is_required: boolean;
}

const initialStageData: StageFormData = {
  name: '',
  description: '',
  guidance_text: '',
  is_required: true,
};

export const TrailStagesManager = ({ trailId, templateId, isReadOnly = false }: TrailStagesManagerProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [formData, setFormData] = useState<StageFormData>(initialStageData);
  
  const { data: stages, isLoading } = useTrailStages(trailId, templateId);
  const createStage = useCreateTrailStage();
  const updateStage = useUpdateTrailStage();
  const deleteStage = useDeleteTrailStage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const stageData = {
      ...formData,
      trail_id: trailId,
      template_id: templateId,
      order_index: stages?.length || 0,
    };

    try {
      if (editingStage) {
        await updateStage.mutateAsync({ id: editingStage, ...formData });
        setEditingStage(null);
      } else {
        await createStage.mutateAsync(stageData);
      }
      
      setFormData(initialStageData);
      setShowAddForm(false);
    } catch (error) {
      console.error('Erro ao salvar etapa:', error);
    }
  };

  const handleEdit = (stage: any) => {
    setFormData({
      name: stage.name,
      description: stage.description || '',
      guidance_text: stage.guidance_text || '',
      is_required: stage.is_required,
    });
    setEditingStage(stage.id);
    setShowAddForm(true);
  };

  const handleDelete = async (stageId: string) => {
    if (confirm('Tem certeza que deseja excluir esta etapa?')) {
      try {
        await deleteStage.mutateAsync(stageId);
      } catch (error) {
        console.error('Erro ao excluir etapa:', error);
      }
    }
  };

  const handleCancel = () => {
    setFormData(initialStageData);
    setEditingStage(null);
    setShowAddForm(false);
  };

  if (isLoading) {
    return <div>Carregando etapas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Etapas da Trilha</h3>
        {!isReadOnly && (
          <Button
            onClick={() => setShowAddForm(true)}
            disabled={showAddForm}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Etapa
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && !isReadOnly && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingStage ? 'Editar Etapa' : 'Nova Etapa'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Etapa</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Digite o nome da etapa..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o que deve ser feito nesta etapa..."
                  className="resize-none"
                />
              </div>

              <div>
                <Label htmlFor="guidance">Texto de Orientação</Label>
                <Textarea
                  id="guidance"
                  value={formData.guidance_text}
                  onChange={(e) => setFormData({ ...formData, guidance_text: e.target.value })}
                  placeholder="Instruções ou dicas para esta etapa..."
                  className="resize-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="required"
                  checked={formData.is_required}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
                />
                <Label htmlFor="required">Etapa obrigatória</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createStage.isPending || updateStage.isPending}>
                  {editingStage ? 'Salvar Alterações' : 'Adicionar Etapa'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stages List */}
      <div className="space-y-3">
        {stages?.map((stage, index) => (
          <Card key={stage.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{stage.name}</h4>
                    {stage.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {stage.description}
                      </p>
                    )}
                    {stage.guidance_text && (
                      <p className="text-sm text-blue-600 mt-2 p-2 bg-blue-50 rounded">
                        💡 {stage.guidance_text}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={stage.is_required ? "default" : "secondary"}>
                        {stage.is_required ? 'Obrigatória' : 'Opcional'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {!isReadOnly && (
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(stage)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(stage.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {(!stages || stages.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                Nenhuma etapa configurada ainda.
                {!isReadOnly && ' Clique em "Adicionar Etapa" para começar.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};