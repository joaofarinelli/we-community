import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ImageUploader } from '@/components/ui/image-uploader';
import { useUpdateTrailTemplate, TrailTemplate } from '@/hooks/useTrailTemplates';
import { TrailAccessSettings } from './TrailAccessSettings';
import type { TrailAccessCriteria } from '@/hooks/useTrailAccess';

const editTemplateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  life_area: z.string().optional(),
  cover_url: z.string().optional(),
});

type EditTemplateFormData = z.infer<typeof editTemplateSchema>;

interface EditTrailTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TrailTemplate | null;
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

export const EditTrailTemplateDialog = ({ open, onOpenChange, template }: EditTrailTemplateDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accessCriteria, setAccessCriteria] = useState<TrailAccessCriteria>({
    is_available_for_all: true,
    required_level_id: undefined,
    required_tags: [],
    required_roles: []
  });
  const updateTemplate = useUpdateTrailTemplate();

  const form = useForm<EditTemplateFormData>({
    resolver: zodResolver(editTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      life_area: 'none',
      cover_url: '',
    },
  });

  useEffect(() => {
    if (template && open) {
      form.reset({
        name: template.name,
        description: template.description || '',
        life_area: template.life_area || 'none',
        cover_url: template.cover_url || '',
      });
      setAccessCriteria(template.access_criteria || {
        is_available_for_all: true,
        required_level_id: undefined,
        required_tags: [],
        required_roles: []
      });
    }
  }, [template, open, form]);

  const onSubmit = async (data: EditTemplateFormData) => {
    if (!template) return;
    
    setIsSubmitting(true);
    try {
      const updateData = { ...data };
      if (updateData.life_area === 'none') {
        updateData.life_area = null;
      }
      await updateTemplate.mutateAsync({
        id: template.id,
        ...updateData,
        access_criteria: accessCriteria,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating template:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Template de Trilha</DialogTitle>
          <DialogDescription>
            Atualize as informações do template.
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
                  <Select onValueChange={field.onChange} value={field.value}>
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

            <FormField
              control={form.control}
              name="cover_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imagem de Capa (Opcional)</FormLabel>
                  <FormControl>
                    <ImageUploader
                      value={field.value}
                      onChange={field.onChange}
                      bucket="post-images"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

        <TrailAccessSettings
          accessCriteria={accessCriteria}
          onAccessCriteriaChange={setAccessCriteria}
          currentTemplateId={template?.id}
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
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};