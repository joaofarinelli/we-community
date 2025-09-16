import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  FileText, 
  Image, 
  Video, 
  File,
  Eye,
  EyeOff
} from 'lucide-react';
import { useUpdateEventMaterial } from '@/hooks/useUpdateEventMaterial';
import { useDeleteEventMaterial } from '@/hooks/useDeleteEventMaterial';
import { useCanEditEvent } from '@/hooks/useCanEditEvent';

interface EventMaterialCardProps {
  material: {
    id: string;
    event_id: string;
    title: string;
    description?: string;
    file_url: string;
    file_name: string;
    file_type: string;
    file_size?: number;
    is_visible_to_participants: boolean;
    created_at: string;
    uploaded_by_profile?: {
      first_name?: string;
      last_name?: string;
      email: string;
    };
  };
  event: {
    space_id: string;
    created_by: string;
    status?: string;
  };
}

export const EventMaterialCard = ({ material, event }: EventMaterialCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(material.title);
  const [description, setDescription] = useState(material.description || '');
  const [isVisible, setIsVisible] = useState(material.is_visible_to_participants);

  const updateMaterial = useUpdateEventMaterial();
  const deleteMaterial = useDeleteEventMaterial();
  const canEdit = useCanEditEvent(event);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb > 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
  };

  const handleSave = () => {
    updateMaterial.mutate({
      id: material.id,
      eventId: material.event_id,
      title,
      description,
      isVisibleToParticipants: isVisible,
    }, {
      onSuccess: () => setIsEditing(false)
    });
  };

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja remover este material?')) {
      deleteMaterial.mutate({
        id: material.id,
        eventId: material.event_id,
        fileUrl: material.file_url,
      });
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = material.file_url;
    link.download = material.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getFileIcon(material.file_type)}
            {isEditing ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                className="text-sm font-semibold"
              />
            ) : (
              <CardTitle className="text-sm font-semibold">{material.title}</CardTitle>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={material.is_visible_to_participants ? "default" : "secondary"} className="text-xs">
              {material.is_visible_to_participants ? (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Visível
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Oculto
                </>
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {isEditing ? (
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
            placeholder="Descrição do material..."
            rows={2}
          />
        ) : (
          material.description && (
            <p className="text-sm text-muted-foreground">{material.description}</p>
          )
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{material.file_name}</span>
          <span>{formatFileSize(material.file_size)}</span>
        </div>

        {canEdit && isEditing && (
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="visibility"
              checked={isVisible}
              onCheckedChange={setIsVisible}
            />
            <Label htmlFor="visibility" className="text-sm">
              Visível para participantes
            </Label>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex-1"
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
          
          {canEdit && (
            <>
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleSave}
                    disabled={updateMaterial.isPending}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Salvar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setTitle(material.title);
                      setDescription(material.description || '');
                      setIsVisible(material.is_visible_to_participants);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteMaterial.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};