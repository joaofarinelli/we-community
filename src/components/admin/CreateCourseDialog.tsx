import { useState } from 'react';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/image-upload';
import { BookOpen, Loader2, Stamp } from 'lucide-react';
import { useCreateCourse } from '@/hooks/useManageCourses';

const courseSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo'),
  description: z.string().optional(),
  thumbnail_url: z.string().optional(),
  certificate_enabled: z.boolean().optional(),
  mentor_name: z.string().optional(),
  mentor_role: z.string().optional(),
  mentor_signature_url: z.string().optional(),
  certificate_background_url: z.string().optional(),
  certificate_footer_text: z.string().optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CreateCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateCourseDialog = ({ open, onOpenChange }: CreateCourseDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createCourse = useCreateCourse();

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      thumbnail_url: '',
      certificate_enabled: false,
      mentor_name: '',
      mentor_role: '',
      mentor_signature_url: '',
      certificate_background_url: '',
      certificate_footer_text: '',
    }
  });

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    try {
      await createCourse.mutateAsync({
        title: data.title,
        description: data.description || undefined,
        thumbnail_url: data.thumbnail_url || undefined,
        certificate_enabled: data.certificate_enabled ?? false,
        mentor_name: data.mentor_name || null,
        mentor_role: data.mentor_role || null,
        mentor_signature_url: data.mentor_signature_url || null,
        certificate_background_url: data.certificate_background_url || null,
        certificate_footer_text: data.certificate_footer_text || null,
      } as any);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating course:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle className="text-xl">Criar Novo Curso</DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            Preencha as informações básicas e, se desejar, habilite o certificado para este curso.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Informações Básicas
              </div>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Título do Curso *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Introdução ao Marketing Digital" 
                        className="h-11"
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
                    <FormLabel className="text-sm font-medium">Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva o conteúdo, objetivos e o que os alunos aprenderão neste curso..."
                        rows={4}
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Visual */}
            <div className="space-y-4">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Imagem de Capa
              </div>
              
              <FormField
                control={form.control}
                name="thumbnail_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Capa do Curso
                    </FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        onRemove={() => field.onChange('')}
                        bucketName="course-thumbnails"
                        maxSizeKB={2048}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Certificado (Opcional) */}
            <div className="space-y-4">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Stamp className="h-4 w-4" />
                Certificado (Opcional)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="mentor_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Mentor(a)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Maria Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mentor_role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo/Título do Mentor(a)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Coordenadora de Formação" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mentor_signature_url"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Assinatura do Mentor(a)</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value || ''}
                          onChange={field.onChange}
                          onRemove={() => field.onChange('')}
                          bucketName="course-thumbnails"
                          maxSizeKB={2048}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="certificate_background_url"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Fundo do Certificado (opcional)</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value || ''}
                          onChange={field.onChange}
                          onRemove={() => field.onChange('')}
                          bucketName="course-thumbnails"
                          maxSizeKB={4096}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="certificate_footer_text"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Texto de Rodapé (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informações adicionais, observações legais, etc."
                          rows={3}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="text-xs text-muted-foreground">
                Observação: Você pode habilitar/desabilitar o certificado depois em "Editar Curso".
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Criar Curso
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
