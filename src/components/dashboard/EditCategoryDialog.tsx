import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEditCategory } from '@/hooks/useEditCategory';
import { useEffect } from 'react';

type EditCategoryFormData = {
  name: string;
  slug?: string;
  permissions: 'public' | 'private';
};

interface EditCategoryDialogProps {
  category: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCategoryDialog({ category, open, onOpenChange }: EditCategoryDialogProps) {
  const { editCategory, isLoading } = useEditCategory();
  
  const form = useForm<EditCategoryFormData>({
    defaultValues: {
      name: '',
      permissions: 'public',
      slug: '',
    }
  });

  useEffect(() => {
    if (category && open) {
      form.reset({
        name: category.name || '',
        permissions: category.permissions || 'public',
        slug: category.slug || '',
      });
    }
  }, [category, open, form]);

  const onSubmit = (data: EditCategoryFormData) => {
    if (!category) return;
    editCategory({ 
      ...data, 
      id: category.id,
      permissions: { can_create_spaces: true, can_manage_members: true, can_moderate_content: true, can_view_analytics: true }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Categoria</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da categoria</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Digite o nome da categoria"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (opcional)</Label>
            <Input
              id="slug"
              {...form.register('slug')}
              placeholder="slug-da-categoria"
            />
            {form.formState.errors.slug && (
              <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="permissions">Tipo de categoria</Label>
            <Select
              value={form.watch('permissions')}
              onValueChange={(value) => form.setValue('permissions', value as 'public' | 'private')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Pública</SelectItem>
                <SelectItem value="private">Privada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}