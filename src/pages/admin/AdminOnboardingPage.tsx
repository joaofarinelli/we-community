import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useOnboardingFlow } from '@/hooks/useOnboardingFlow';
import { useOnboardingSteps } from '@/hooks/useOnboardingSteps';
import { AdminOnboardingStepForm } from '@/components/admin/AdminOnboardingStepForm';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Plus, 
  Save, 
  Trash2, 
  GripVertical,
  Play,
  Pause,
  Users,
  CheckCircle2,
  Clock
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { OnboardingStep } from '@/hooks/useOnboardingSteps';

const stepTypeConfig = {
  welcome: { label: 'Boas-vindas', icon: '👋', color: 'bg-blue-100 text-blue-800' },
  profile: { label: 'Perfil', icon: '👤', color: 'bg-green-100 text-green-800' },
  spaces: { label: 'Espaços', icon: '🏠', color: 'bg-purple-100 text-purple-800' },
  tags: { label: 'Interesses', icon: '🏷️', color: 'bg-orange-100 text-orange-800' },
  finish: { label: 'Finalização', icon: '🎉', color: 'bg-yellow-100 text-yellow-800' },
};

interface SortableStepItemProps {
  step: OnboardingStep;
  onEdit: (step: OnboardingStep) => void;
  onDelete: (id: string) => void;
}

function SortableStepItem({ step, onEdit, onDelete }: SortableStepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const config = stepTypeConfig[step.step_type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg"
    >
      <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <Badge className={config.color}>
            {config.icon} {config.label}
          </Badge>
          {step.is_required && (
            <Badge variant="outline" className="text-xs">
              Obrigatório
            </Badge>
          )}
        </div>
        <h3 className="font-medium text-foreground truncate">{step.title}</h3>
        {step.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {step.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(step)}
        >
          Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(step.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export const AdminOnboardingPage = () => {
  const { flow, isLoading, createFlow, updateFlow, deleteFlow } = useOnboardingFlow();
  const { steps, createStep, updateStep, deleteStep, reorderSteps } = useOnboardingSteps(flow?.id);
  
  const [flowData, setFlowData] = useState({
    name: flow?.name || 'Onboarding Padrão',
    description: flow?.description || '',
  });
  
  const [editingStep, setEditingStep] = useState<OnboardingStep | null>(null);
  const [isCreatingStep, setIsCreatingStep] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleCreateFlow = () => {
    createFlow(flowData);
  };

  const handleUpdateFlow = () => {
    if (!flow) return;
    updateFlow({
      id: flow.id,
      ...flowData,
    });
  };

  const handleToggleActive = () => {
    if (!flow) return;
    updateFlow({
      id: flow.id,
      is_active: !flow.is_active,
    });
  };

  const handleSaveStep = (stepData: Omit<OnboardingStep, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingStep) {
      updateStep({
        id: editingStep.id,
        ...stepData,
      });
    } else {
      createStep(stepData);
    }
    setEditingStep(null);
    setIsCreatingStep(false);
  };

  const handleDeleteStep = (id: string) => {
    if (confirm('Tem certeza que deseja remover este passo?')) {
      deleteStep(id);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = steps.findIndex((step) => step.id === active.id);
      const newIndex = steps.findIndex((step) => step.id === over?.id);
      const reorderedSteps = arrayMove(steps, oldIndex, newIndex);
      reorderSteps(reorderedSteps as OnboardingStep[]);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Onboarding</h1>
            <p className="text-muted-foreground mt-1">
              Configure o processo de integração de novos usuários
            </p>
          </div>
        </div>

        {/* Flow Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Configuração do Fluxo
                </CardTitle>
                <CardDescription>
                  Configure as informações básicas do seu fluxo de onboarding
                </CardDescription>
              </div>
              {flow && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {flow.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                    <Switch
                      checked={flow.is_active}
                      onCheckedChange={handleToggleActive}
                    />
                  </div>
                  {flow.is_active ? (
                    <Badge className="bg-green-100 text-green-800">
                      <Play className="h-3 w-3 mr-1" />
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Pause className="h-3 w-3 mr-1" />
                      Inativo
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flow-name">Nome do Fluxo</Label>
                <Input
                  id="flow-name"
                  value={flowData.name}
                  onChange={(e) => setFlowData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Onboarding Padrão"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="flow-description">Descrição</Label>
              <Textarea
                id="flow-description"
                value={flowData.description}
                onChange={(e) => setFlowData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o objetivo deste fluxo de onboarding"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              {flow ? (
                <Button onClick={handleUpdateFlow} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Salvar Alterações
                </Button>
              ) : (
                <Button onClick={handleCreateFlow} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Fluxo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Steps Configuration */}
        {flow && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Passos do Onboarding ({steps.length})
                  </CardTitle>
                  <CardDescription>
                    Configure os passos que os usuários seguirão durante o onboarding
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsCreatingStep(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Passo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {steps.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhum passo configurado
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Adicione passos para criar seu fluxo de onboarding
                  </p>
                  <Button onClick={() => setIsCreatingStep(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Passo
                  </Button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {steps.map((step) => (
                        <SortableStepItem
                          key={step.id}
                          step={step}
                          onEdit={setEditingStep}
                          onDelete={handleDeleteStep}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step Form Dialog */}
        {(isCreatingStep || editingStep) && (
          <AdminOnboardingStepForm
            step={editingStep}
            onSave={handleSaveStep}
            onCancel={() => {
              setEditingStep(null);
              setIsCreatingStep(false);
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
};