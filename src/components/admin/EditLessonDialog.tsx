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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LessonMaterialUploader } from '@/components/ui/lesson-material-uploader';
import { useUpdateLesson } from '@/hooks/useManageCourses';
import { useLessonMaterials, useCreateLessonMaterial, useDeleteLessonMaterial } from '@/hooks/useLessonMaterials';
import { convertYouTubeUrl } from '@/lib/youtube';

const lessonSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  content: z.string().optional(),
  video_url: z.string().url('URL deve ser válida').optional().or(z.literal('')),
  duration: z.number().min(0, 'Duração deve ser positiva').optional(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
});

type LessonFormData = z.infer<typeof lessonSchema>;

interface EditLessonDialogProps {
  lesson: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditLessonDialog = ({ lesson, open, onOpenChange }: EditLessonDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [materials, setMaterials] = useState<Array<{ id?: string; title: string; file_url: string }>>([]);
  const updateLesson = useUpdateLesson();
  const { data: existingMaterials } = useLessonMaterials(lesson?.id || '');
  const createLessonMaterial = useCreateLessonMaterial();
  const deleteLessonMaterial = useDeleteLessonMaterial();

  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      video_url: '',
      duration: 0,
      difficulty_level: 'beginner',
    }
  });

  useEffect(() => {
    if (lesson) {
      form.reset({
        title: lesson.title || '',
        description: lesson.description || '',
        content: lesson.content || '',
        video_url: lesson.video_url || '',
        duration: lesson.duration || 0,
        difficulty_level: (lesson as any).difficulty_level || 'beginner',
      });
    }
  }, [lesson, form]);

  useEffect(() => {
    if (existingMaterials) {
      setMaterials(existingMaterials.map(mat => ({
        id: mat.id,
        title: mat.title,
        file_url: mat.file_url,
      })));
    }
  }, [existingMaterials]);

  const onSubmit = async (data: LessonFormData) => {
    if (!lesson?.id) return;
    
    setIsSubmitting(true);
    try {
      // Convert YouTube URL to embed format if needed
      const videoUrl = data.video_url ? convertYouTubeUrl(data.video_url) : undefined;
      
      await updateLesson.mutateAsync({
        id: lesson.id,
        module_id: lesson.module_id,
        title: data.title,
        description: data.description || undefined,
        content: data.content || undefined,
        video_url: videoUrl,
        duration: data.duration || undefined,
        difficulty_level: data.difficulty_level,
      });

      // Gerenciar materiais
      const existingIds = existingMaterials?.map(m => m.id) || [];
      const currentIds = materials.filter(m => m.id).map(m => m.id);
      
      // Deletar materiais removidos
      const toDelete = existingIds.filter(id => !currentIds.includes(id));
      await Promise.all(
        toDelete.map(id => 
          deleteLessonMaterial.mutateAsync({ materialId: id!, lessonId: lesson.id })
        )
      );

      // Criar novos materiais
      const newMaterials = materials.filter(m => !m.id && m.title && m.file_url);
      await Promise.all(
        newMaterials.map(material =>
          createLessonMaterial.mutateAsync({
            lessonId: lesson.id,
            title: material.title,
            fileUrl: material.file_url,
          })
        )
      );

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating lesson:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMaterial = () => {
    setMaterials([...materials, { title: '', file_url: '' }]);
  };

  const removeMaterial = async (index: number) => {
    const material = materials[index];
    if (material.id) {
      // Material existente - deletar do banco
      try {
        await deleteLessonMaterial.mutateAsync({ 
          materialId: material.id, 
          lessonId: lesson?.id || '' 
        });
      } catch (error) {
        console.error('Error deleting material:', error);
      }
    }
    // Remover da lista local
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
          <DialogTitle>Editar Aula</DialogTitle>
          <DialogDescription>
            Atualize as informações da aula
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
                      placeholder="https://www.youtube.com/watch?v=... ou https://youtube.com/embed/..." 
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
                    <h4 className="text-sm font-medium">
                      Material {index + 1} {material.id && '(Existente)'}
                    </h4>
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

                    <LessonMaterialUploader
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
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};