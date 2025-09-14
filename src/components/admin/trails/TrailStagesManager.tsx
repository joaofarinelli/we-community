import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, GripVertical, FileText } from 'lucide-react';
import { useTrailStages, useCreateTrailStage, useUpdateTrailStage, useDeleteTrailStage, ResponseType } from '@/hooks/useTrailStages';
import { DocumentUploader } from '@/components/ui/document-uploader';
import { convertYouTubeUrl } from '@/lib/youtube';


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
  video_url: string;
  document_url: string;
  question: string;
  requires_response: boolean;
  response_type: ResponseType;
  response_options: Array<{ label: string; value: string }>;
  allow_multiple_files: boolean;
  max_file_size_mb: number;
  allowed_file_types: string[];
}

const initialStageData: StageFormData = {
  name: '',
  description: '',
  guidance_text: '',
  is_required: true,
  video_url: '',
  document_url: '',
  question: '',
  requires_response: false,
  response_type: 'text',
  response_options: [],
  allow_multiple_files: false,
  max_file_size_mb: 10,
  allowed_file_types: [],
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
    
    // Convert YouTube URL to embed format if needed
    const videoUrl = formData.video_url ? convertYouTubeUrl(formData.video_url) : '';
    
    const stageData = {
      ...formData,
      video_url: videoUrl,
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
      video_url: stage.video_url || '',
      document_url: stage.document_url || '',
      question: stage.question || '',
      requires_response: stage.requires_response || false,
      response_type: stage.response_type || 'text',
      response_options: stage.response_options || [],
      allow_multiple_files: stage.allow_multiple_files || false,
      max_file_size_mb: stage.max_file_size_mb || 10,
      allowed_file_types: stage.allowed_file_types || [],
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

              <div>
                <Label htmlFor="video_url">URL do Vídeo (opcional)</Label>
                <Input
                  id="video_url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... ou https://youtube.com/embed/..."
                />
              </div>

              <DocumentUploader
                value={formData.document_url}
                onChange={(url) => setFormData({ ...formData, document_url: url || '' })}
                label="Documento de Orientação (opcional)"
              />

              <div className="flex items-center space-x-2">
                <Switch
                  id="requires_response"
                  checked={formData.requires_response}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_response: checked })}
                />
                <Label htmlFor="requires_response">Requer resposta do usuário</Label>
              </div>

              {formData.requires_response && (
                <>
                  <div>
                    <Label htmlFor="question">Pergunta para o usuário</Label>
                    <Textarea
                      id="question"
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      placeholder="Qual pergunta o usuário deve responder?"
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="response_type">Tipo de Resposta</Label>
                    <Select
                      value={formData.response_type}
                      onValueChange={(value: ResponseType) => setFormData({ ...formData, response_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de resposta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texto livre</SelectItem>
                        <SelectItem value="multiple_choice">Múltipla escolha</SelectItem>
                        <SelectItem value="checkbox">Seleção múltipla</SelectItem>
                        <SelectItem value="scale">Escala (0-10)</SelectItem>
                        <SelectItem value="file_upload">Upload de arquivos</SelectItem>
                        <SelectItem value="image_upload">Upload de imagens</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(formData.response_type === 'multiple_choice' || formData.response_type === 'checkbox') && (
                    <div>
                      <Label>Opções de Resposta</Label>
                      <div className="space-y-2">
                        {formData.response_options.map((option, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={option.label}
                              onChange={(e) => {
                                const newOptions = [...formData.response_options];
                                newOptions[index] = { ...option, label: e.target.value, value: e.target.value };
                                setFormData({ ...formData, response_options: newOptions });
                              }}
                              placeholder="Texto da opção"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newOptions = formData.response_options.filter((_, i) => i !== index);
                                setFormData({ ...formData, response_options: newOptions });
                              }}
                            >
                              Remover
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              response_options: [...formData.response_options, { label: '', value: '' }]
                            });
                          }}
                        >
                          Adicionar Opção
                        </Button>
                      </div>
                    </div>
                  )}

                  {(formData.response_type === 'file_upload' || formData.response_type === 'image_upload') && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="allow_multiple_files"
                          checked={formData.allow_multiple_files}
                          onCheckedChange={(checked) => setFormData({ ...formData, allow_multiple_files: checked })}
                        />
                        <Label htmlFor="allow_multiple_files">Permitir múltiplos arquivos</Label>
                      </div>

                      <div>
                        <Label htmlFor="max_file_size">Tamanho máximo (MB)</Label>
                        <Input
                          id="max_file_size"
                          type="number"
                          min="1"
                          max="100"
                          value={formData.max_file_size_mb}
                          onChange={(e) => setFormData({ ...formData, max_file_size_mb: parseInt(e.target.value) || 10 })}
                        />
                      </div>

                      {formData.response_type === 'file_upload' && (
                        <div>
                          <Label htmlFor="allowed_types">Tipos de arquivo permitidos (separados por vírgula)</Label>
                          <Input
                            id="allowed_types"
                            value={formData.allowed_file_types.join(', ')}
                            onChange={(e) => {
                              const types = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                              setFormData({ ...formData, allowed_file_types: types });
                            }}
                            placeholder="pdf, doc, docx, txt"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

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