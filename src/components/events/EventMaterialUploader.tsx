import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';
import { useCreateEventMaterial } from '@/hooks/useCreateEventMaterial';

interface EventMaterialUploaderProps {
  eventId: string;
  onClose: () => void;
}

export const EventMaterialUploader = ({ eventId, onClose }: EventMaterialUploaderProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const createMaterial = useCreateEventMaterial();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleUpload = () => {
    if (!file || !title.trim()) return;

    createMaterial.mutate({
      eventId,
      title: title.trim(),
      description: description.trim() || undefined,
      file,
      isVisibleToParticipants: isVisible,
    }, {
      onSuccess: () => {
        onClose();
        setTitle('');
        setDescription('');
        setFile(null);
        setIsVisible(false);
      }
    });
  };

  const maxFileSize = 50 * 1024 * 1024; // 50MB
  const isFileTooLarge = file && file.size > maxFileSize;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Adicionar Material</CardTitle>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            {file ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                {isFileTooLarge && (
                  <p className="text-xs text-destructive">
                    Arquivo muito grande. Máximo: 50MB
                  </p>
                )}
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm">
                  Arraste um arquivo aqui ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground">
                  Máximo: 50MB
                </p>
              </>
            )}
          </div>

          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) handleFileSelect(selectedFile);
            }}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
          />

          <div className="space-y-2">
            <Label htmlFor="title">Título do Material *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              placeholder="Digite o título do material"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              placeholder="Descreva o conteúdo do material..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="visibility"
              checked={isVisible}
              onCheckedChange={setIsVisible}
            />
            <Label htmlFor="visibility">Visível para participantes</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!file || !title.trim() || isFileTooLarge || createMaterial.isPending}
              className="flex-1"
            >
              {createMaterial.isPending ? 'Enviando...' : 'Adicionar'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};