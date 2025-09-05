import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, X, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { OnboardingStep } from '@/hooks/useOnboardingSteps';

interface AdminOnboardingStepFormProps {
  step?: OnboardingStep | null;
  onSave: (stepData: Omit<OnboardingStep, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

const stepTypeOptions = [
  {
    value: 'welcome',
    label: 'Boas-vindas',
    description: 'Mensagem de boas-vindas com texto e imagem opcional',
    icon: '👋'
  },
  {
    value: 'profile',
    label: 'Perfil',
    description: 'Coleta dados do perfil do usuário (nome, foto, bio, etc.)',
    icon: '👤'
  },
  {
    value: 'spaces',
    label: 'Espaços',
    description: 'Permite ao usuário escolher espaços para participar',
    icon: '🏠'
  },
  {
    value: 'tags',
    label: 'Interesses',
    description: 'Coleta tags de interesse do usuário',
    icon: '🏷️'
  },
  {
    value: 'terms',
    label: 'Termos e Condições',
    description: 'Aceite de termos e condições obrigatório',
    icon: '📋'
  },
  {
    value: 'finish',
    label: 'Finalização',
    description: 'Mensagem final de conclusão do onboarding',
    icon: '🎉'
  },
];

const defaultConfigs = {
  welcome: {
    message: 'Bem-vindo(a) à nossa plataforma!',
    image_url: '',
    show_skip_button: true,
  },
  profile: {
    required_fields: ['first_name', 'last_name'],
    optional_fields: ['avatar_url', 'bio', 'phone'],
    allow_skip: false,
  },
  spaces: {
    min_selection: 1,
    max_selection: null,
    show_all_spaces: true,
    allow_skip: true,
  },
  tags: {
    min_selection: 1,
    max_selection: 5,
    predefined_tags: [],
    allow_custom_tags: true,
    allow_skip: true,
  },
  terms: {
    terms_text: 'Ao usar nossa plataforma, você concorda com nossos termos e condições.',
    terms_url: '',
    require_scroll: true,
    acceptance_label: 'Li e aceito os termos e condições',
  },
  finish: {
    message: 'Parabéns! Você concluiu o onboarding com sucesso!',
    celebration_type: 'confetti',
    redirect_url: '/dashboard',
  },
};

export const AdminOnboardingStepForm = ({ step, onSave, onCancel }: AdminOnboardingStepFormProps) => {
  const [formData, setFormData] = useState({
    flow_id: step?.flow_id || '',
    step_type: step?.step_type || 'welcome' as const,
    title: step?.title || '',
    description: step?.description || '',
    order_index: step?.order_index || 0,
    config: step?.config || defaultConfigs.welcome,
    is_required: step?.is_required ?? true,
  });

  useEffect(() => {
    if (!step) {
      // Reset config when step type changes for new steps
      setFormData(prev => ({
        ...prev,
        config: defaultConfigs[prev.step_type],
      }));
    }
  }, [formData.step_type, step]);

  const handleStepTypeChange = (stepType: OnboardingStep['step_type']) => {
    setFormData(prev => ({
      ...prev,
      step_type: stepType,
      config: step ? prev.config : defaultConfigs[stepType],
    }));
  };

  const handleConfigChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value,
      },
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const selectedStepType = stepTypeOptions.find(opt => opt.value === formData.step_type);

  const renderStepConfig = () => {
    switch (formData.step_type) {
      case 'welcome':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="welcome-message">Mensagem de Boas-vindas</Label>
              <Textarea
                id="welcome-message"
                value={formData.config.message || ''}
                onChange={(e) => handleConfigChange('message', e.target.value)}
                placeholder="Digite a mensagem de boas-vindas..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="welcome-image">URL da Imagem (opcional)</Label>
              <Input
                id="welcome-image"
                value={formData.config.image_url || ''}
                onChange={(e) => handleConfigChange('image_url', e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-skip"
                checked={formData.config.show_skip_button || false}
                onCheckedChange={(checked) => handleConfigChange('show_skip_button', checked)}
              />
              <Label htmlFor="show-skip">Mostrar botão "Pular"</Label>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Configure quais campos do perfil serão obrigatórios ou opcionais durante o onboarding.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label>Campos Obrigatórios</Label>
              <div className="flex flex-wrap gap-2">
                {['first_name', 'last_name', 'avatar_url', 'bio', 'phone'].map((field) => (
                  <Badge
                    key={field}
                    variant={(formData.config as any).required_fields?.includes(field) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const required = (formData.config as any).required_fields || [];
                      const newRequired = required.includes(field)
                        ? required.filter((f: string) => f !== field)
                        : [...required, field];
                      handleConfigChange('required_fields', newRequired);
                    }}
                  >
                    {field === 'first_name' && 'Nome'}
                    {field === 'last_name' && 'Sobrenome'}
                    {field === 'avatar_url' && 'Foto'}
                    {field === 'bio' && 'Bio'}
                    {field === 'phone' && 'Telefone'}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 'spaces':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-spaces">Mínimo de Espaços</Label>
                <Input
                  id="min-spaces"
                  type="number"
                  min="0"
                  value={(formData.config as any).min_selection || 0}
                  onChange={(e) => handleConfigChange('min_selection', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-spaces">Máximo de Espaços (opcional)</Label>
                <Input
                  id="max-spaces"
                  type="number"
                  min="1"
                  value={(formData.config as any).max_selection || ''}
                  onChange={(e) => handleConfigChange('max_selection', e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-all-spaces"
                checked={(formData.config as any).show_all_spaces ?? true}
                onCheckedChange={(checked) => handleConfigChange('show_all_spaces', checked)}
              />
              <Label htmlFor="show-all-spaces">Mostrar todos os espaços públicos</Label>
            </div>
          </div>
        );

      case 'tags':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-tags">Mínimo de Tags</Label>
                <Input
                  id="min-tags"
                  type="number"
                  min="0"
                  value={(formData.config as any).min_selection || 0}
                  onChange={(e) => handleConfigChange('min_selection', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-tags">Máximo de Tags</Label>
                <Input
                  id="max-tags"
                  type="number"
                  min="1"
                  value={(formData.config as any).max_selection || 5}
                  onChange={(e) => handleConfigChange('max_selection', parseInt(e.target.value))}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="allow-custom-tags"
                checked={(formData.config as any).allow_custom_tags ?? true}
                onCheckedChange={(checked) => handleConfigChange('allow_custom_tags', checked)}
              />
              <Label htmlFor="allow-custom-tags">Permitir tags personalizadas</Label>
            </div>
          </div>
        );

      case 'terms':
        return (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Configure os termos e condições que os usuários devem aceitar antes de prosseguir.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="terms-text">Texto dos Termos</Label>
              <Textarea
                id="terms-text"
                value={formData.config.terms_text || ''}
                onChange={(e) => handleConfigChange('terms_text', e.target.value)}
                placeholder="Digite o conteúdo dos termos e condições..."
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms-url">URL dos Termos (opcional)</Label>
              <Input
                id="terms-url"
                value={formData.config.terms_url || ''}
                onChange={(e) => handleConfigChange('terms_url', e.target.value)}
                placeholder="https://exemplo.com/termos"
              />
              <p className="text-xs text-muted-foreground">
                Se fornecida, será exibido um link para os termos completos
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="acceptance-label">Texto do Aceite</Label>
              <Input
                id="acceptance-label"
                value={formData.config.acceptance_label || ''}
                onChange={(e) => handleConfigChange('acceptance_label', e.target.value)}
                placeholder="Li e aceito os termos e condições"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="require-scroll"
                checked={formData.config.require_scroll ?? true}
                onCheckedChange={(checked) => handleConfigChange('require_scroll', checked)}
              />
              <Label htmlFor="require-scroll">Exigir rolagem completa do texto</Label>
            </div>
          </div>
        );

      case 'finish':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="finish-message">Mensagem de Finalização</Label>
              <Textarea
                id="finish-message"
                value={formData.config.message || ''}
                onChange={(e) => handleConfigChange('message', e.target.value)}
                placeholder="Digite a mensagem de conclusão..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="celebration-type">Tipo de Celebração</Label>
              <Select
                value={(formData.config as any).celebration_type || 'confetti'}
                onValueChange={(value) => handleConfigChange('celebration_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confetti">Confetti</SelectItem>
                  <SelectItem value="none">Nenhuma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="redirect-url">URL de Redirecionamento (opcional)</Label>
              <Input
                id="redirect-url"
                value={(formData.config as any).redirect_url || ''}
                onChange={(e) => handleConfigChange('redirect_url', e.target.value)}
                placeholder="/dashboard"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {selectedStepType?.icon} {step ? 'Editar Passo' : 'Novo Passo'}
              </CardTitle>
              <CardDescription>
                {step ? 'Modifique as configurações do passo' : 'Configure um novo passo do onboarding'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="step-type">Tipo do Passo</Label>
              <Select
                value={formData.step_type}
                onValueChange={handleStepTypeChange}
                disabled={!!step}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stepTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="step-title">Título do Passo</Label>
              <Input
                id="step-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Complete seu perfil"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="step-description">Descrição (opcional)</Label>
              <Textarea
                id="step-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o que o usuário deve fazer neste passo"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-required"
                checked={formData.is_required}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: checked }))}
              />
              <Label htmlFor="is-required">Passo obrigatório</Label>
            </div>
          </div>

          <Separator />

          {/* Step-specific Configuration */}
          <div>
            <h3 className="text-lg font-medium mb-4">Configurações Específicas</h3>
            {renderStepConfig()}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {step ? 'Salvar Alterações' : 'Criar Passo'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};