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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { BookOpen, Loader2, Settings, Stamp } from 'lucide-react';
import { useUpdateCourse } from '@/hooks/useManageCourses';
import { useCourses } from '@/hooks/useCourses';

const courseSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo'),
  description: z.string().optional(),
  thumbnail_url: z.string().optional(),
  is_active: z.boolean(),
  certificate_enabled: z.boolean().optional(),
  linear_module_progression: z.boolean().optional(),
  prerequisite_course_id: z.string().optional(),
  mentor_name: z.string().optional(),
  mentor_role: z.string().optional(),
  mentor_signature_url: z.string().optional(),
  certificate_background_url: z.string().optional(),
  certificate_footer_text: z.string().optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface EditCourseDialogProps {
  course: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditCourseDialog = ({ course, open, onOpenChange }: EditCourseDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateCourse = useUpdateCourse();
  const { data: courses = [] } = useCourses();

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      thumbnail_url: '',
      is_active: true,
      certificate_enabled: false,
      linear_module_progression: false,
      prerequisite_course_id: '',
      mentor_name: '',
      mentor_role: '',
      mentor_signature_url: '',
      certificate_background_url: '',
      certificate_footer_text: '',
    }
  });

  useEffect(() => {
    if (course) {
      form.reset({
        title: course.title || '',
        description: course.description || '',
        thumbnail_url: course.thumbnail_url || '',
        is_active: course.is_active ?? true,
        certificate_enabled: course.certificate_enabled ?? false,
        linear_module_progression: (course as any)?.linear_module_progression ?? false,
        prerequisite_course_id: (course as any)?.prerequisite_course_id || '',
        mentor_name: course.mentor_name || '',
        mentor_role: course.mentor_role || '',
        mentor_signature_url: course.mentor_signature_url || '',
        certificate_background_url: course.certificate_background_url || '',
        certificate_footer_text: course.certificate_footer_text || '',
      });
    }
  }, [course, form]);

  const onSubmit = async (data: CourseFormData) => {
    if (!course?.id) return;
    
    setIsSubmitting(true);
    try {
      await updateCourse.mutateAsync({
        id: course.id,
        title: data.title,
        description: data.description || undefined,
        thumbnail_url: data.thumbnail_url || undefined,
        is_active: data.is_active,
        certificate_enabled: data.certificate_enabled ?? false,
        linear_module_progression: data.linear_module_progression ?? false,
        prerequisite_course_id: data.prerequisite_course_id || null,
        mentor_name: data.mentor_name || null,
        mentor_role: data.mentor_role || null,
        mentor_signature_url: data.mentor_signature_url || null,
        certificate_background_url: data.certificate_background_url || null,
        certificate_footer_text: data.certificate_footer_text || null,
      } as any);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating course:', error);
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
              <Settings className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle className="text-xl">Editar Curso</DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            Atualize as informações do curso "{course?.title}". As alterações serão aplicadas imediatamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information Section */}
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

            {/* Visual Section */}
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

            {/* Pré-requisitos e Progressão */}
            <div className="space-y-4">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Pré-requisitos e Progressão
              </div>

              <FormField
                control={form.control}
                name="prerequisite_course_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Curso Pré-requisito</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione um curso pré-requisito (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhum pré-requisito</SelectItem>
                        {courses
                          .filter(c => c.id !== course?.id) // Não mostrar o próprio curso
                          .map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">
                      Usuários precisarão completar o curso selecionado antes de acessar este curso
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="linear_module_progression"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-y-0">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">Progressão Linear de Módulos</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Quando ativada, usuários precisam completar módulos em ordem sequencial
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Certificado */}
            <div className="space-y-4">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Stamp className="h-4 w-4" />
                Certificado
              </div>

              <FormField
                control={form.control}
                name="certificate_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-y-0">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">Habilitar Certificado</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Ao habilitar, usuárias que concluírem o curso poderão emitir um certificado.
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('certificate_enabled') && (
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
              )}
            </div>

            {/* Settings Section */}
            <div className="space-y-4">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Configurações
              </div>
              
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-y-0">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">Curso Ativo</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Quando ativo, o curso ficará visível para os usuários na plataforma
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
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
                    Salvando...
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Salvar Alterações
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
