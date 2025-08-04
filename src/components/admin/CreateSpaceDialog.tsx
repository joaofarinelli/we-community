import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSpaceCategories } from '@/hooks/useSpaceCategories';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateSpaceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateSpaceDialog = ({ isOpen, onOpenChange }: CreateSpaceDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'secret'>('public');
  const [categoryId, setCategoryId] = useState('');

  const { data: categories = [] } = useSpaceCategories();
  const queryClient = useQueryClient();
  
  const { mutate: createSpace, isPending } = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      visibility: 'public' | 'private' | 'secret';
      category_id?: string;
    }) => {
      const { data: newSpace, error } = await supabase
        .from('spaces')
        .insert({
          name: data.name,
          description: data.description,
          visibility: data.visibility,
          category_id: data.category_id,
          company_id: '00000000-0000-0000-0000-000000000000', // This will be handled by RLS
          created_by: '00000000-0000-0000-0000-000000000000', // This will be handled by RLS
        })
        .select()
        .single();

      if (error) throw error;
      return newSpace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['spaceCategories'] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      await createSpace({
        name: name.trim(),
        description: description.trim() || undefined,
        visibility,
        category_id: categoryId || undefined,
      });

      toast.success('Espaço criado com sucesso!');
      onOpenChange(false);
      
      // Reset form
      setName('');
      setDescription('');
      setVisibility('public');
      setCategoryId('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar espaço');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Espaço</DialogTitle>
          <DialogDescription>
            Crie um novo espaço para organizar conversas e conteúdo.
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
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Criando...' : 'Criar Espaço'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};