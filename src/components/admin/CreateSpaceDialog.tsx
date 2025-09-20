import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSpaceCategories } from '@/hooks/useSpaceCategories';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { toast } from 'sonner';

const createSpaceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  visibility: z.enum(['public', 'private', 'secret']),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
});

type FormData = z.infer<typeof createSpaceSchema>;

interface CreateSpaceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateSpaceDialog = ({ isOpen, onOpenChange }: CreateSpaceDialogProps) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const { data: categories = [] } = useSpaceCategories();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createSpaceSchema),
    defaultValues: {
      name: '',
      description: '',
      visibility: 'public',
      categoryId: '',
    },
  });
  
  const { mutate: createSpace, isPending } = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      visibility: 'public' | 'private' | 'secret';
      category_id: string;
    }) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      if (!currentCompanyId) {
        throw new Error('Contexto da empresa não encontrado');
      }

      console.log('🔧 Starting space creation using RPC...', {
        userId: user.id,
        companyId: currentCompanyId,
        categoryId: data.category_id,
        name: data.name
      });

      // Use the new RPC function that handles all validations and context
      const { data: newSpace, error } = await supabase.rpc('create_space_with_context', {
        p_company_id: currentCompanyId,
        p_category_id: data.category_id,
        p_name: data.name,
        p_description: data.description || null,
        p_visibility: data.visibility,
        p_type: 'discussion'
      });

      if (error) {
        console.error('❌ Space creation error via RPC:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Erro ao criar espaço: ${error.message}`);
      }
      
      console.log('✅ Space created successfully via RPC:', newSpace);
      return newSpace;
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['spaces', currentCompanyId] });
      queryClient.invalidateQueries({ queryKey: ['spaceCategories', currentCompanyId] });
      queryClient.invalidateQueries({ queryKey: ['userSpaces', currentCompanyId] });
      
      toast.success('Espaço criado com sucesso!');
      onOpenChange(false);
      
      // Reset form
      reset();
    },
    onError: (error: any) => {
      console.error('Erro ao criar espaço:', error);
      
      // Mensagens de erro mais específicas
      if (error.message.includes('Sessão de autenticação inválida')) {
        toast.error('Sessão expirada. Recarregue a página e tente novamente.');
      } else if (error.message.includes('contexto da empresa')) {
        toast.error('Erro de contexto. Selecione novamente a empresa e tente novamente.');
      } else if (error.message.includes('row-level security policy')) {
        toast.error('Erro de permissão. Verifique se você tem permissão para criar espaços.');
      } else {
        toast.error(`Erro ao criar espaço: ${error.message}`);
      }
    },
  });

  const onSubmit = (data: FormData) => {
    // Auto-selecionar primeira categoria se nenhuma foi selecionada
    let finalCategoryId = data.categoryId;
    if (!finalCategoryId && categories.length > 0) {
      finalCategoryId = categories[0].id;
      toast.info(`Categoria "${categories[0].name}" selecionada automaticamente`);
    }

    if (!finalCategoryId) {
      toast.error('Selecione uma categoria ou crie uma categoria primeiro');
      return;
    }

    createSpace({
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      visibility: data.visibility,
      category_id: finalCategoryId,
    });
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Espaço *</Label>
            <Input
              id="name"
              placeholder="Digite o nome do espaço"
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o propósito deste espaço (opcional)"
              rows={3}
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select 
              value={watch('categoryId')} 
              onValueChange={(value) => setValue('categoryId', value)}
            >
              <SelectTrigger className={errors.categoryId ? 'border-destructive' : ''}>
                <SelectValue placeholder={categories.length > 0 ? "Selecione uma categoria" : "Nenhuma categoria disponível"} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-destructive">{errors.categoryId.message}</p>
            )}
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Crie uma categoria primeiro para organizar seus espaços.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Visibilidade</Label>
            <Select 
              value={watch('visibility')} 
              onValueChange={(value: 'public' | 'private' | 'secret') => setValue('visibility', value)}
            >
              <SelectTrigger className={errors.visibility ? 'border-destructive' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Público - Visível para todos</SelectItem>
                <SelectItem value="private">Privado - Apenas membros convidados</SelectItem>
                <SelectItem value="secret">Secreto - Oculto da lista de espaços</SelectItem>
              </SelectContent>
            </Select>
            {errors.visibility && (
              <p className="text-sm text-destructive">{errors.visibility.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || categories.length === 0}>
              {isPending ? 'Criando...' : 'Criar Espaço'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
