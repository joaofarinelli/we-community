import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateSpace } from '@/hooks/useUpdateSpace';
import { useSpaceCategories } from '@/hooks/useSpaceCategories';
import { toast } from 'sonner';

interface EditSpaceDialogProps {
  space: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditSpaceDialog = ({ space, isOpen, onOpenChange }: EditSpaceDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'secret'>('public');
  const [categoryId, setCategoryId] = useState('');

  const { data: categories = [] } = useSpaceCategories();
  const updateSpaceMutation = useUpdateSpace();

  useEffect(() => {
    if (space) {
      setName(space.name || '');
      setDescription(space.description || '');
      setVisibility(space.visibility || 'public');
      setCategoryId(space.category_id || '');
    }
  }, [space]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      await updateSpaceMutation.mutateAsync({
        id: space.id,
        name: name.trim(),
        description: description.trim() || undefined,
        visibility,
        category_id: categoryId || undefined,
      });

      toast.success('Espaço atualizado com sucesso!');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar espaço');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Espaço</DialogTitle>
          <DialogDescription>
            Atualize as informações do espaço.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Espaço *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do espaço"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito deste espaço (opcional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem categoria</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Visibilidade</Label>
            <Select value={visibility} onValueChange={(value: 'public' | 'private' | 'secret') => setVisibility(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Público - Visível para todos</SelectItem>
                <SelectItem value="private">Privado - Apenas membros convidados</SelectItem>
                <SelectItem value="secret">Secreto - Oculto da lista de espaços</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateSpaceMutation.isPending}>
              {updateSpaceMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};