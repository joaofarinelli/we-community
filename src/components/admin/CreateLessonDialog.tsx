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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DocumentUploader } from '@/components/ui/document-uploader';
import { useCreateLesson } from '@/hooks/useManageCourses';
import { useCreateLessonMaterial } from '@/hooks/useLessonMaterials';

const lessonSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  content: z.string().optional(),
  video_url: z.string().url('URL deve ser válida').optional().or(z.literal('')),
  duration: z.number().min(0, 'Duração deve ser positiva').optional(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  materials: z.array(z.object({
    title: z.string().min(1, 'Título do material é obrigatório'),
    file_url: z.string().min(1, 'Arquivo é obrigatório'),
  })).optional(),
});

type LessonFormData = z.infer<typeof lessonSchema>;

interface CreateLessonDialogProps {
  moduleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateLessonDialog = ({ moduleId, open, onOpenChange }: CreateLessonDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materials, setMaterials] = useState<Array<{ title: string; file_url: string }>>([]);
  const createLesson = useCreateLesson();
  const createLessonMaterial = useCreateLessonMaterial();

  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      video_url: '',
      duration: 0,
      difficulty_level: 'beginner',
      materials: [],
    }
  });

  const onSubmit = async (data: LessonFormData) => {
    setIsSubmitting(true);
    try {
      const lesson = await createLesson.mutateAsync({
        module_id: moduleId,
        title: data.title,
        description: data.description || undefined,
        content: data.content || undefined,
        video_url: data.video_url || undefined,
        duration: data.duration || undefined,
        difficulty_level: data.difficulty_level,
      });

      // Criar materiais da aula se houver
      if (materials.length > 0) {
        await Promise.all(
          materials.map(material =>
            createLessonMaterial.mutateAsync({
              lessonId: lesson.id,
              title: material.title,
              fileUrl: material.file_url,
            })
          )
        );
      }

      form.reset();
      setMaterials([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating lesson:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMaterial = () => {
    setMaterials([...materials, { title: '', file_url: '' }]);
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const updateMaterial = (index: number, field: 'title' | 'file_url', value: string) => {
    const updatedMaterials = materials.map((material, i) =>
      i === index ? { ...material, [field]: value } : material
    );
    setMaterials(updatedMaterials);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Aula</DialogTitle>
          <DialogDescription>
            Preencha as informações da aula
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
                      placeholder="Ex: Introdução aos Conceitos Básicos" 
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
                      placeholder="Descreva o que será abordado na aula"
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="video_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Vídeo (opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://youtube.com/embed/... ou https://vimeo.com/..." 
                      type="url"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duração (em minutos)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: 15" 
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="difficulty_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível de Dificuldade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o nível de dificuldade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="beginner">Iniciante</SelectItem>
                      <SelectItem value="intermediate">Intermediário</SelectItem>
                      <SelectItem value="advanced">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo da Aula (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Digite o conteúdo da aula em texto (material de apoio, transcrição, etc.)"
                      rows={6}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seção de Materiais */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Materiais da Aula (opcional)</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMaterial}
                  disabled={isSubmitting}
                >
                  Adicionar Material
                </Button>
              </div>

              {materials.map((material, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Material {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeMaterial(index)}
                      disabled={isSubmitting}
                    >
                      Remover
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <FormLabel>Título do Material</FormLabel>
                      <Input
                        placeholder="Ex: PDF com exercícios, slides da apresentação..."
                        value={material.title}
                        onChange={(e) => updateMaterial(index, 'title', e.target.value)}
                      />
                    </div>

                    <DocumentUploader
                      label="Arquivo"
                      value={material.file_url || undefined}
                      onChange={(url) => updateMaterial(index, 'file_url', url || '')}
                    />
                  </div>
                </div>
              ))}
            </div>

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
                {isSubmitting ? 'Criando...' : 'Criar Aula'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};