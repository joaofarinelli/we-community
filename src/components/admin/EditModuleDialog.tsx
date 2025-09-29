import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useUpdateModule } from '@/hooks/useManageCourses';
import { ImageUploader } from '@/components/ui/image-uploader';

const moduleSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  linear_lesson_progression: z.boolean().optional(),
  thumbnail_url: z.string().optional(),
});

type ModuleFormData = z.infer<typeof moduleSchema>;

interface EditModuleDialogProps {
  module: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditModuleDialog = ({ module, open, onOpenChange }: EditModuleDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateModule = useUpdateModule();

  const form = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: '',
      description: '',
      linear_lesson_progression: false,
      thumbnail_url: '',
    }
  });

  useEffect(() => {
    if (module) {
      form.reset({
        title: module.title || '',
        description: module.description || '',
        linear_lesson_progression: module.linear_lesson_progression || false,
        thumbnail_url: module.thumbnail_url || '',
      });
    }
  }, [module, form]);

  const onSubmit = async (data: ModuleFormData) => {
    if (!module?.id) return;
    
    setIsSubmitting(true);
    try {
      await updateModule.mutateAsync({
        id: module.id,
        course_id: module.course_id,
        title: data.title,
        description: data.description || undefined,
        linear_lesson_progression: data.linear_lesson_progression || false,
        thumbnail_url: data.thumbnail_url || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating module:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Módulo</DialogTitle>
          <DialogDescription>
            Atualize as informações do módulo
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Fundamentos do Marketing" 
                      {...field} 
                    />
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o conteúdo e objetivos do módulo"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbnail_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capa do Módulo</FormLabel>
                  <FormControl>
                    <ImageUploader
                      value={field.value || ''}
                      onChange={field.onChange}
                      bucket="course-images"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linear_lesson_progression"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Progressão Linear das Aulas
                    </FormLabel>
                    <FormDescription>
                      Quando ativado, os usuários precisam completar uma aula antes de acessar a próxima
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
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