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
import { ImageUploader } from '@/components/ui/image-uploader';
import { useCreateTrailTemplate } from '@/hooks/useTrailTemplates';
import { TrailAccessSettings } from './TrailAccessSettings';
import { TrailStagesManager } from './TrailStagesManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TrailAccessCriteria } from '@/hooks/useTrailAccess';

const createAdminTrailSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  life_area: z.string().optional(),
  cover_url: z.string().optional(),
});

type CreateAdminTrailFormData = z.infer<typeof createAdminTrailSchema>;

interface AdminCreateTrailDialogProps {
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

export const AdminCreateTrailDialog = ({ open, onOpenChange }: AdminCreateTrailDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState('details');
  const [createdTemplateId, setCreatedTemplateId] = useState<string | null>(null);
  const [accessCriteria, setAccessCriteria] = useState<TrailAccessCriteria>({
    is_available_for_all: true,
    required_level_id: undefined,
    required_tags: [],
    required_roles: []
  });
  const createTemplate = useCreateTrailTemplate();

  const form = useForm<CreateAdminTrailFormData>({
    resolver: zodResolver(createAdminTrailSchema),
    defaultValues: {
      name: '',
      description: '',
      life_area: 'none',
      cover_url: '',
    },
  });

  const onSubmit = async (data: CreateAdminTrailFormData) => {
    setIsSubmitting(true);
    try {
      const createData = { ...data, access_criteria: accessCriteria };
      if (createData.life_area === 'none') {
        createData.life_area = null;
      }
      const result = await createTemplate.mutateAsync(createData);
      setCreatedTemplateId(result.id);
      setCurrentTab('stages');
    } catch (error) {
      console.error('Error creating trail template:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setCreatedTemplateId(null);
    setCurrentTab('details');
    setAccessCriteria({
      is_available_for_all: true,
      required_level_id: undefined,
      required_tags: [],
      required_roles: []
    });
    onOpenChange(false);
  };

  const handleFinish = () => {
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Trilha Administrativa</DialogTitle>
          <DialogDescription>
            Crie uma trilha completa com etapas que os usuários podem participar.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="access" disabled={!createdTemplateId}>Acesso</TabsTrigger>
            <TabsTrigger value="stages" disabled={!createdTemplateId}>Etapas</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Trilha</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome da trilha..." {...field} />
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
                          placeholder="Descreva o objetivo desta trilha..."
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

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Criando...' : 'Próximo: Configurar Acesso'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="access" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Configurações de Acesso</h3>
                <p className="text-sm text-muted-foreground">
                  Defina quem pode acessar esta trilha.
                </p>
              </div>

              <TrailAccessSettings
                accessCriteria={accessCriteria}
                onAccessCriteriaChange={setAccessCriteria}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentTab('details')}
                >
                  Voltar
                </Button>
                <Button onClick={() => setCurrentTab('stages')}>
                  Próximo: Configurar Etapas
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stages" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Etapas da Trilha</h3>
                <p className="text-sm text-muted-foreground">
                  Configure as etapas que os usuários precisarão completar.
                </p>
              </div>

              {createdTemplateId && (
                <TrailStagesManager templateId={createdTemplateId} />
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentTab('access')}
                >
                  Voltar
                </Button>
                <Button onClick={handleFinish}>
                  Finalizar
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};