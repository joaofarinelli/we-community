import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X, Users, Bell, MessageSquare, BookOpen, Hash, Image, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useBulkActions } from '@/hooks/useBulkActions';
import { useFileUpload } from '@/hooks/useFileUpload';
import { FilteredUser, UserFilters } from '@/hooks/useCompanyUsersWithFilters';

interface BulkActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filteredUsers: FilteredUser[];
  filters: UserFilters;
}

type ActionType = 'notification' | 'announcement' | 'course_access' | 'space_access';

export function BulkActionsDialog({ open, onOpenChange, filteredUsers, filters }: BulkActionsDialogProps) {
  const [actionType, setActionType] = useState<ActionType>('notification');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date>();
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    bulkSendNotifications,
    createBulkAnnouncement,
    bulkGrantCourseAccess,
    bulkGrantSpaceAccess,
  } = useBulkActions();

  const { uploadFile, isUploading } = useFileUpload({
    bucket: 'announcement-images',
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  });

  const resetForm = () => {
    setTitle('');
    setContent('');
    setIsMandatory(false);
    setExpiresAt(undefined);
    setSelectedCourseId('');
    setSelectedSpaceId('');
    setImageUrl('');
    setImagePreview('');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    const userIds = filteredUsers.map(user => user.user_id);

    if (userIds.length === 0) {
      return;
    }

    try {
      switch (actionType) {
        case 'notification':
          if (!title.trim() || !content.trim()) return;
          await bulkSendNotifications.mutateAsync({
            title: title.trim(),
            content: content.trim(),
            userIds,
          });
          break;

        case 'announcement':
          if (!title.trim() || !content.trim()) return;
          await createBulkAnnouncement.mutateAsync({
            title: title.trim(),
            content: content.trim(),
            isMandatory,
            expiresAt: expiresAt?.toISOString(),
            imageUrl: imageUrl || undefined,
            userIds,
          });
          break;

        case 'course_access':
          if (!selectedCourseId) return;
          await bulkGrantCourseAccess.mutateAsync({
            courseId: selectedCourseId,
            userIds,
          });
          break;

        case 'space_access':
          if (!selectedSpaceId) return;
          await bulkGrantSpaceAccess.mutateAsync({
            spaceId: selectedSpaceId,
            userIds,
          });
          break;
      }

      handleClose();
    } catch (error) {
      console.error('Error executing bulk action:', error);
    }
  };

  const getActionIcon = (type: ActionType) => {
    switch (type) {
      case 'notification': return <Bell className="h-4 w-4" />;
      case 'announcement': return <MessageSquare className="h-4 w-4" />;
      case 'course_access': return <BookOpen className="h-4 w-4" />;
      case 'space_access': return <Hash className="h-4 w-4" />;
    }
  };

  const getActionTitle = (type: ActionType) => {
    switch (type) {
      case 'notification': return 'Enviar Notificações';
      case 'announcement': return 'Criar Anúncio';
      case 'course_access': return 'Conceder Acesso a Curso';
      case 'space_access': return 'Conceder Acesso a Espaço';
    }
  };

  const isFormValid = () => {
    switch (actionType) {
      case 'notification':
      case 'announcement':
        return title.trim() && content.trim();
      case 'course_access':
        return selectedCourseId;
      case 'space_access':
        return selectedSpaceId;
      default:
        return false;
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await uploadFile(file);
    if (url) {
      setImageUrl(url);
      setImagePreview(URL.createObjectURL(file));
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    setImageUrl('');
    setImagePreview('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ações em Massa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Count */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Usuários selecionados:</span>
              <Badge variant="secondary">
                {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            {/* Active Filters Display */}
            <div className="mt-2 flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="outline" className="text-xs">
                  Busca: {filters.search}
                </Badge>
              )}
              {filters.roles && filters.roles.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Cargos: {filters.roles.join(', ')}
                </Badge>
              )}
              {filters.tagIds && filters.tagIds.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Tags: {filters.tagIds.length}
                </Badge>
              )}
              {filters.levelIds && filters.levelIds.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Níveis: {filters.levelIds.length}
                </Badge>
              )}
              {filters.badgeIds && filters.badgeIds.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Selos: {filters.badgeIds.length}
                </Badge>
              )}
            </div>
          </div>

          {/* Action Type Selection */}
          <div className="space-y-3">
            <Label>Tipo de Ação</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['notification', 'announcement', 'course_access', 'space_access'] as ActionType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setActionType(type)}
                  className={cn(
                    "p-3 border rounded-lg text-left transition-colors",
                    actionType === type
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getActionIcon(type)}
                    <span className="font-medium text-sm">{getActionTitle(type)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action-specific fields */}
          {(actionType === 'notification' || actionType === 'announcement') && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Digite o título..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Digite o conteúdo da mensagem..."
                  rows={4}
                />
              </div>

              {actionType === 'announcement' && (
                <>
                  <div className="space-y-2">
                    <Label>Imagem (opcional)</Label>
                    
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full max-h-48 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="w-full"
                        >
                          {isUploading ? (
                            'Enviando...'
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Selecionar Imagem
                            </>
                          )}
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="mandatory"
                      checked={isMandatory}
                      onCheckedChange={setIsMandatory}
                    />
                    <Label htmlFor="mandatory">
                      Anúncio obrigatório (usuário deve aceitar/dispensar)
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Expiração (opcional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !expiresAt && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {expiresAt ? format(expiresAt, 'P', { locale: ptBR }) : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={expiresAt}
                          onSelect={setExpiresAt}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {expiresAt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpiresAt(undefined)}
                        className="h-auto p-1 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Remover data
                      </Button>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {actionType === 'course_access' && (
            <div className="space-y-2">
              <Label>Selecionar Curso</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um curso..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course-1">Curso de Exemplo 1</SelectItem>
                  <SelectItem value="course-2">Curso de Exemplo 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {actionType === 'space_access' && (
            <div className="space-y-2">
              <Label>Selecionar Espaço</Label>
              <Select value={selectedSpaceId} onValueChange={setSelectedSpaceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um espaço..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="space-1">Espaço de Exemplo 1</SelectItem>
                  <SelectItem value="space-2">Espaço de Exemplo 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!isFormValid() || filteredUsers.length === 0}
            >
              {getActionTitle(actionType)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}