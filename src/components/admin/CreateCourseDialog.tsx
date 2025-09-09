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
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BookOpen, Loader2, Stamp, Users, Shield, Award } from 'lucide-react';
import { useCreateCourse } from '@/hooks/useManageCourses';
import { useTags } from '@/hooks/useTags';
import { useCompanyLevels } from '@/hooks/useCompanyLevels';
import { useTrailBadges } from '@/hooks/useTrailBadges';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { setGlobalCompanyId } from '@/integrations/supabase/client';

const courseSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo'),
  description: z.string().optional(),
  thumbnail_url: z.string().optional(),
  certificate_enabled: z.boolean().optional(),
  linear_module_progression: z.boolean().optional(),
  mentor_name: z.string().optional(),
  mentor_role: z.string().optional(),
  mentor_signature_url: z.string().optional(),
  certificate_background_url: z.string().optional(),
  certificate_footer_text: z.string().optional(),
  access_tag_ids: z.array(z.string()).optional(),
  access_level_ids: z.array(z.string()).optional(),
  access_badge_ids: z.array(z.string()).optional(),
  access_logic: z.enum(['any', 'all']).optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CreateCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateCourseDialog = ({ open, onOpenChange }: CreateCourseDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createCourse = useCreateCourse();
  const { data: tags = [] } = useTags();
  const { data: levels = [] } = useCompanyLevels();
  const { data: badges = [] } = useTrailBadges();
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      thumbnail_url: '',
      certificate_enabled: false,
      linear_module_progression: false,
      mentor_name: '',
      mentor_role: '',
      mentor_signature_url: '',
      certificate_background_url: '',
      certificate_footer_text: '',
      access_tag_ids: [],
      access_level_ids: [],
      access_badge_ids: [],
      access_logic: 'any',
    }
  });

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    console.log('🔧 CreateCourse: user.id:', user?.id, 'currentCompanyId:', currentCompanyId);
    
    // Reinforce context before the operation
    if (currentCompanyId) {
      setGlobalCompanyId(currentCompanyId);
    }
    
    try {
      await createCourse.mutateAsync({
        title: data.title,
        description: data.description || undefined,
        thumbnail_url: data.thumbnail_url || undefined,
        certificate_enabled: data.certificate_enabled ?? false,
        linear_module_progression: data.linear_module_progression ?? false,
        mentor_name: data.mentor_name || null,
        mentor_role: data.mentor_role || null,
        mentor_signature_url: data.mentor_signature_url || null,
        certificate_background_url: data.certificate_background_url || null,
        certificate_footer_text: data.certificate_footer_text || null,
        access_criteria: {
          tag_ids: data.access_tag_ids || [],
          level_ids: data.access_level_ids || [],
          badge_ids: data.access_badge_ids || [],
          logic: data.access_logic || 'any'
        }
      });
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

            {/* Acesso ao Curso */}
            <div className="space-y-4">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Users className="h-4 w-4" />
                Acesso ao Curso
              </div>
              <p className="text-sm text-muted-foreground">
                Ao criar o curso, o acesso será concedido automaticamente a usuários que correspondem aos critérios selecionados.
              </p>

              {/* Logic Selector */}
              <FormField
                control={form.control}
                name="access_logic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lógica de Combinação</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-row space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="any" id="any" />
                          <label htmlFor="any" className="text-sm">Qualquer critério (recomendado)</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="all" id="all" />
                          <label htmlFor="all" className="text-sm">Todos os critérios</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags */}
              <FormField
                control={form.control}
                name="access_tag_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Tags
                    </FormLabel>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
                      {tags.map((tag) => (
                        <div key={tag.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tag-${tag.id}`}
                            checked={field.value?.includes(tag.id) || false}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, tag.id]);
                              } else {
                                field.onChange(current.filter((id) => id !== tag.id));
                              }
                            }}
                          />
                          <label
                            htmlFor={`tag-${tag.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </label>
                        </div>
                      ))}
                      {tags.length === 0 && (
                        <p className="text-sm text-muted-foreground col-span-2">Nenhuma tag cadastrada</p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Levels */}
              <FormField
                control={form.control}
                name="access_level_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Níveis
                    </FormLabel>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
                      {levels.map((level) => (
                        <div key={level.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`level-${level.id}`}
                            checked={field.value?.includes(level.id) || false}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, level.id]);
                              } else {
                                field.onChange(current.filter((id) => id !== level.id));
                              }
                            }}
                          />
                          <label
                            htmlFor={`level-${level.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: level.level_color }}
                            />
                            {level.level_name}
                          </label>
                        </div>
                      ))}
                      {levels.length === 0 && (
                        <p className="text-sm text-muted-foreground col-span-2">Nenhum nível cadastrado</p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Badges */}
              <FormField
                control={form.control}
                name="access_badge_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Stamp className="h-4 w-4" />
                      Selos
                    </FormLabel>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
                      {badges.filter(badge => badge.is_active).map((badge) => (
                        <div key={badge.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`badge-${badge.id}`}
                            checked={field.value?.includes(badge.id) || false}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, badge.id]);
                              } else {
                                field.onChange(current.filter((id) => id !== badge.id));
                              }
                            }}
                          />
                          <label
                            htmlFor={`badge-${badge.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: badge.background_color }}
                            />
                            {badge.name}
                          </label>
                        </div>
                      ))}
                      {badges.filter(badge => badge.is_active).length === 0 && (
                        <p className="text-sm text-muted-foreground col-span-2">Nenhum selo ativo cadastrado</p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Progressão de Módulos */}
            <div className="space-y-4">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Progressão de Módulos
              </div>

              <FormField
                control={form.control}
                name="linear_module_progression"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-y-0">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">Progressão Linear</FormLabel>
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
