import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Megaphone, GraduationCap, Users } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useSpaces } from '@/hooks/useSpaces';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { type BulkAction } from '@/hooks/useBulkActionsNew';

interface BulkActionConfigTabProps {
  actionType: BulkAction['action_type'];
  actionConfig: any;
  onActionTypeChange: (type: BulkAction['action_type']) => void;
  onActionConfigChange: (config: any) => void;
}

const actionTypes = [
  { value: 'notification', label: 'Notificação', icon: Bell },
  { value: 'announcement', label: 'Anúncio', icon: Megaphone },
  { value: 'course_access', label: 'Acesso ao Curso', icon: GraduationCap },
  { value: 'space_access', label: 'Acesso ao Espaço', icon: Users },
];

export function BulkActionConfigTab({
  actionType,
  actionConfig,
  onActionTypeChange,
  onActionConfigChange,
}: BulkActionConfigTabProps) {
  const { data: courses = [] } = useCourses();
  const { data: spaces = [] } = useSpaces();
  
  const { uploadFile, isUploading } = useFileUpload({
    bucket: 'announcement-images',
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  });

  const updateConfig = (updates: any) => {
    onActionConfigChange({ ...actionConfig, ...updates });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await uploadFile(file);
    if (url) {
      updateConfig({ imageUrl: url });
    }
    
    // Reset input
    event.target.value = '';
  };

  const removeImage = () => {
    updateConfig({ imageUrl: undefined });
  };

  const renderActionTypeSelector = () => (
    <div className="space-y-3">
      <Label>Tipo de Ação *</Label>
      <div className="grid grid-cols-2 gap-3">
        {actionTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card
              key={type.value}
              className={`cursor-pointer transition-colors hover:bg-accent ${
                actionType === type.value ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onActionTypeChange(type.value as BulkAction['action_type'])}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{type.label}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderNotificationConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          placeholder="Título da notificação"
          value={actionConfig.title || ''}
          onChange={(e) => updateConfig({ title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Conteúdo *</Label>
        <Textarea
          id="content"
          placeholder="Conteúdo da notificação..."
          value={actionConfig.content || ''}
          onChange={(e) => updateConfig({ content: e.target.value })}
          rows={4}
        />
      </div>
    </div>
  );

  const renderAnnouncementConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          placeholder="Título do anúncio"
          value={actionConfig.title || ''}
          onChange={(e) => updateConfig({ title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Conteúdo *</Label>
        <Textarea
          id="content"
          placeholder="Conteúdo do anúncio..."
          value={actionConfig.content || ''}
          onChange={(e) => updateConfig({ content: e.target.value })}
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <Label>Imagem (opcional)</Label>
        {actionConfig.imageUrl ? (
          <div className="space-y-2">
            <img 
              src={actionConfig.imageUrl} 
              alt="Imagem do anúncio" 
              className="w-full max-h-48 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={removeImage}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Remover imagem
            </Button>
          </div>
        ) : (
          <div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageUpload}
              className="hidden"
              id="announcement-image-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('announcement-image-upload')?.click()}
              disabled={isUploading}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Enviando...' : 'Selecionar imagem'}
            </Button>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="mandatory"
          checked={actionConfig.isMandatory || false}
          onCheckedChange={(checked) => updateConfig({ isMandatory: checked })}
        />
        <Label htmlFor="mandatory">Anúncio obrigatório</Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="expires_at">Data de Expiração</Label>
        <Input
          id="expires_at"
          type="datetime-local"
          value={actionConfig.expiresAt || ''}
          onChange={(e) => updateConfig({ expiresAt: e.target.value })}
        />
      </div>
    </div>
  );

  const renderCourseAccessConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="course">Curso *</Label>
        <Select
          value={actionConfig.courseId || ''}
          onValueChange={(value) => updateConfig({ courseId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um curso" />
          </SelectTrigger>
          <SelectContent>
            {(courses as any).map((course: any) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderSpaceAccessConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="space">Espaço *</Label>
        <Select
          value={actionConfig.spaceId || ''}
          onValueChange={(value) => updateConfig({ spaceId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um espaço" />
          </SelectTrigger>
          <SelectContent>
            {(spaces as any).map((space: any) => (
              <SelectItem key={space.id} value={space.id}>
                {space.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderConfigContent = () => {
    switch (actionType) {
      case 'notification':
        return renderNotificationConfig();
      case 'announcement':
        return renderAnnouncementConfig();
      case 'course_access':
        return renderCourseAccessConfig();
      case 'space_access':
        return renderSpaceAccessConfig();
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração da Ação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderActionTypeSelector()}
        
        {actionType && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Parâmetros da Ação</h4>
            {renderConfigContent()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}