import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { CreateTagData, UpdateTagData, Tag } from '@/hooks/useTags';
import { ImageUpload } from '@/components/ui/image-upload';

interface TagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTagData | UpdateTagData) => void;
  tag?: Tag | null;
  isLoading?: boolean;
}

const defaultColors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#F97316', '#06B6D4', '#84CC16',
  '#EC4899', '#6B7280'
];

const popularEmojis = [
  '🏷️', '⭐', '🔥', '💎', '👑', '🎯', '💝', '🚀',
  '💰', '🎨', '🌟', '⚡', '🎪', '🎭', '🎲', '🎸',
  '📱', '💻', '🏠', '🚗', '✈️', '🍕', '☕', '🎂'
];

export const TagDialog = ({ open, onOpenChange, onSubmit, tag, isLoading }: TagDialogProps) => {
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [iconType, setIconType] = useState<'none' | 'emoji' | 'image'>('none');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [uploadedImage, setUploadedImage] = useState('');
  
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<CreateTagData>();

  // Atualizar estados quando a tag muda
  useEffect(() => {
    if (tag) {
      // Atualizar estados locais
      setSelectedColor(tag.color);
      setIconType(tag.icon_type || 'none');
      setSelectedEmoji(tag.icon_type === 'emoji' ? tag.icon_value || '' : '');
      setUploadedImage(tag.icon_type === 'image' ? tag.icon_value || '' : '');
      
      // Atualizar valores do formulário
      setValue('name', tag.name);
      setValue('color', tag.color);
      setValue('description', tag.description || '');
    } else {
      // Reset para valores padrão quando for criar nova tag
      setSelectedColor('#3B82F6');
      setIconType('none');
      setSelectedEmoji('');
      setUploadedImage('');
      
      setValue('name', '');
      setValue('color', '#3B82F6');
      setValue('description', '');
    }
  }, [tag, setValue]);

  // Reset form quando o dialog fechar
  useEffect(() => {
    if (!open) {
      reset();
      if (!tag) {
        setSelectedColor('#3B82F6');
        setIconType('none');
        setSelectedEmoji('');
        setUploadedImage('');
      }
    }
  }, [open, tag, reset]);

  const handleFormSubmit = (data: CreateTagData) => {
    let iconValue = null;
    
    if (iconType === 'emoji' && selectedEmoji) {
      iconValue = selectedEmoji;
    } else if (iconType === 'image' && uploadedImage) {
      iconValue = uploadedImage;
    }

    const submitData = { 
      ...data, 
      color: selectedColor,
      icon_type: iconType,
      icon_value: iconValue
    };
    
    if (tag) {
      onSubmit({ ...submitData, id: tag.id } as UpdateTagData);
    } else {
      onSubmit(submitData);
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{tag ? 'Editar Tag' : 'Nova Tag'}</DialogTitle>
          <DialogDescription>
            {tag ? 'Edite as informações da tag.' : 'Crie uma nova tag para organizar sua audiência.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Tag *</Label>
            <Input
              id="name"
              {...register('name', { required: 'Nome é obrigatório' })}
              placeholder="Ex: Cliente VIP, Novo usuário..."
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Cor da Tag</Label>
            <div className="flex flex-wrap gap-2">
              {defaultColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color ? 'border-foreground scale-110' : 'border-border'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full h-10"
            />
          </div>

          <div className="space-y-2">
            <Label>Ícone da Tag</Label>
            <Tabs value={iconType} onValueChange={(value) => setIconType(value as typeof iconType)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="none">Sem Ícone</TabsTrigger>
                <TabsTrigger value="emoji">Emoji</TabsTrigger>
                <TabsTrigger value="image">Imagem</TabsTrigger>
              </TabsList>
              
              <TabsContent value="none" className="mt-4">
                <p className="text-sm text-muted-foreground">A tag não terá ícone.</p>
              </TabsContent>
              
              <TabsContent value="emoji" className="mt-4 space-y-3">
                <div className="grid grid-cols-8 gap-2">
                  {popularEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                       className={`p-2 text-lg rounded-md border transition-colors apple-emoji ${
                         selectedEmoji === emoji 
                           ? 'border-primary bg-primary/10' 
                           : 'border-border hover:border-primary/50'
                       }`}
                     >
                       {emoji}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Ou digite um emoji customizado:</Label>
                  <Input
                    value={selectedEmoji}
                    onChange={(e) => setSelectedEmoji(e.target.value)}
                    placeholder="Digite um emoji..."
                    className="text-center text-lg apple-emoji"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="image" className="mt-4">
                <ImageUpload
                  value={uploadedImage}
                  onChange={setUploadedImage}
                  onRemove={() => setUploadedImage('')}
                  bucketName="space-icons"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Recomendamos imagens quadradas (1:1) para melhor resultado.
                </p>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descrição opcional da tag..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : tag ? 'Atualizar' : 'Criar Tag'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};