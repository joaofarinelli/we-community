import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCreateTrailTemplate } from '@/hooks/useTrailTemplates';
import { TrailAccessSettings } from './TrailAccessSettings';
import type { TrailAccessCriteria } from '@/hooks/useTrailAccess';

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  life_area: z.string().optional(),
});

type CreateTemplateFormData = z.infer<typeof createTemplateSchema>;

interface CreateTrailTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const lifeAreas = [
  'Carreira',
  'Relacionamentos', 
  'Saúde e Bem-estar',
  'Desenvolvimento Pessoal',
  'Finanças',
  'Família',
  'Espiritualidade',
  'Lazer e Hobbies',
  'Educação',
  'Outros'
];

export const CreateTrailTemplateDialog = ({ open, onOpenChange }: CreateTrailTemplateDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessCriteria, setAccessCriteria] = useState<TrailAccessCriteria>({
    is_available_for_all: true,
    required_level_id: undefined,
    required_tags: [],
    required_roles: []
  });
  const createTemplate = useCreateTrailTemplate();

  const form = useForm<CreateTemplateFormData>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      life_area: 'none',
    },
  });

  const onSubmit = async (data: CreateTemplateFormData) => {
    setIsSubmitting(true);
    try {
      const createData = { ...data, access_criteria: accessCriteria };
      if (createData.life_area === 'none') {
        createData.life_area = null;
      }
      await createTemplate.mutateAsync(createData);
      form.reset();
      setAccessCriteria({
        is_available_for_all: true,
        required_level_id: undefined,
        required_tags: [],
        required_roles: []
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating template:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Template de Trilha</DialogTitle>
          <DialogDescription>
            Crie um template reutilizável que pode ser usado pelas usuárias para criar suas trilhas.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Template</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome do template..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o objetivo deste template..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="life_area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Área da Vida (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma área da vida" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {lifeAreas.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <TrailAccessSettings
              accessCriteria={accessCriteria}
              onAccessCriteriaChange={setAccessCriteria}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Criando...' : 'Criar Template'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};