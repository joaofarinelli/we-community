import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useForm } from 'react-hook-form';
import { CreateTagData, UpdateTagData, Tag } from '@/hooks/useTags';
import { ImageUpload } from '@/components/ui/image-upload';
import EmojiPicker from 'emoji-picker-react';
import { Smile } from 'lucide-react';

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

export const TagDialog = ({ open, onOpenChange, onSubmit, tag, isLoading }: TagDialogProps) => {
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [selectedTextColor, setSelectedTextColor] = useState('#FFFFFF');
  const [iconType, setIconType] = useState<'none' | 'emoji' | 'image'>('none');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [uploadedImage, setUploadedImage] = useState('');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<CreateTagData>();

  // Atualizar estados quando a tag muda
  useEffect(() => {
    if (tag) {
      // Atualizar estados locais
      setSelectedColor(tag.color);
      setSelectedTextColor(tag.text_color || '#FFFFFF');
      setIconType(tag.icon_type || 'none');
      setSelectedEmoji(tag.icon_type === 'emoji' ? tag.icon_value || '' : '');
      setUploadedImage(tag.icon_type === 'image' ? tag.icon_value || '' : '');
      
      // Atualizar valores do formulário
      setValue('name', tag.name);
      setValue('color', tag.color);
      setValue('text_color', tag.text_color || '#FFFFFF');
      setValue('description', tag.description || '');
    } else {
      // Reset para valores padrão quando for criar nova tag
      setSelectedColor('#3B82F6');
      setSelectedTextColor('#FFFFFF');
      setIconType('none');
      setSelectedEmoji('');
      setUploadedImage('');
      
      setValue('name', '');
      setValue('color', '#3B82F6');
      setValue('text_color', '#FFFFFF');
      setValue('description', '');
    }
  }, [tag, setValue]);

  // Reset form quando o dialog fechar
  useEffect(() => {
    if (!open) {
      reset();
      setEmojiPickerOpen(false);
      if (!tag) {
        setSelectedColor('#3B82F6');
        setSelectedTextColor('#FFFFFF');
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
      text_color: selectedTextColor,
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
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tag ? 'Editar Tag' : 'Nova Tag'}</DialogTitle>
          <DialogDescription>
            {tag ? 'Edite as informações da tag.' : 'Crie uma nova tag para organizar sua audiência.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 px-1">
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
            <div className="grid grid-cols-5 sm:flex sm:flex-wrap gap-2">
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
            <Label>Cor do Texto</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedTextColor('#FFFFFF')}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selectedTextColor === '#FFFFFF' ? 'border-foreground scale-110' : 'border-border'
                }`}
                style={{ backgroundColor: '#FFFFFF' }}
              />
              <button
                type="button"
                onClick={() => setSelectedTextColor('#000000')}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selectedTextColor === '#000000' ? 'border-foreground scale-110' : 'border-border'
                }`}
                style={{ backgroundColor: '#000000' }}
              />
            </div>
            <Input
              type="color"
              value={selectedTextColor}
              onChange={(e) => setSelectedTextColor(e.target.value)}
              className="w-full h-10"
            />
            <div className="mt-2 p-2 rounded border" style={{ backgroundColor: selectedColor, color: selectedTextColor }}>
              Prévia da tag
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ícone da Tag</Label>
            <Tabs value={iconType} onValueChange={(value) => setIconType(value as typeof iconType)}>
              <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
                <TabsTrigger value="none" className="px-2">Sem</TabsTrigger>
                <TabsTrigger value="emoji" className="px-2">Emoji</TabsTrigger>
                <TabsTrigger value="image" className="px-2">Imagem</TabsTrigger>
              </TabsList>
              
              <TabsContent value="none" className="mt-4">
                <p className="text-sm text-muted-foreground">A tag não terá ícone.</p>
              </TabsContent>
              
              <TabsContent value="emoji" className="mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Label>Emoji selecionado:</Label>
                  {selectedEmoji && (
                    <div className="p-2 border rounded-md bg-muted/50">
                      <span className="text-xl">{selectedEmoji}</span>
                    </div>
                  )}
                </div>

                <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full gap-2"
                    >
                      <Smile className="h-4 w-4" />
                      {selectedEmoji ? 'Trocar emoji' : 'Escolher emoji'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-0 border-0 shadow-lg overflow-hidden" 
                    align="center"
                    side="bottom"
                    sideOffset={5}
                  >
                    <div className="relative max-h-[400px] sm:max-h-[450px] overflow-auto">
                      <EmojiPicker
                        onEmojiClick={(emojiObject) => {
                          setSelectedEmoji(emojiObject.emoji);
                          setEmojiPickerOpen(false);
                        }}
                        width={Math.min(350, window.innerWidth - 40)}
                        height={Math.min(400, window.innerHeight - 200)}
                        searchDisabled={false}
                        skinTonesDisabled={false}
                        lazyLoadEmojis={true}
                        previewConfig={{
                          showPreview: true,
                          defaultEmoji: "1f60a"
                        }}
                        style={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: 'none'
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>

                {selectedEmoji && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEmoji('')}
                    className="w-full text-muted-foreground"
                  >
                    Limpar seleção
                  </Button>
                )}
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