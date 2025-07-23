import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { CreateTagData, UpdateTagData, Tag } from '@/hooks/useTags';

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
  const [selectedColor, setSelectedColor] = useState(tag?.color || '#3B82F6');
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateTagData>({
    defaultValues: {
      name: tag?.name || '',
      color: tag?.color || '#3B82F6',
      description: tag?.description || '',
    }
  });

  const handleFormSubmit = (data: CreateTagData) => {
    const submitData = { ...data, color: selectedColor };
    if (tag) {
      onSubmit({ ...submitData, id: tag.id } as UpdateTagData);
    } else {
      onSubmit(submitData);
    }
    reset();
    setSelectedColor('#3B82F6');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
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