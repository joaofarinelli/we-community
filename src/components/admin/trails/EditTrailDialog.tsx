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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUpdateTrail } from '@/hooks/useTrails';
import { TrailStagesManager } from './TrailStagesManager';

const editTrailSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  status: z.enum(['active', 'paused', 'completed']),
  life_area: z.string().optional(),
});

type EditTrailFormData = z.infer<typeof editTrailSchema>;

interface Trail {
  id: string;
  name: string;
  description?: string;
  status: string;
  life_area?: string;
  user_id: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
  };
}

interface EditTrailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trail: Trail | null;
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

export const EditTrailDialog = ({ open, onOpenChange, trail }: EditTrailDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateTrail = useUpdateTrail();

  const form = useForm<EditTrailFormData>({
    resolver: zodResolver(editTrailSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'active',
      life_area: 'none',
    },
  });

  useEffect(() => {
    if (trail && open) {
      form.reset({
        name: trail.name,
        description: trail.description || '',
        status: trail.status as 'active' | 'paused' | 'completed',
        life_area: trail.life_area || 'none',
      });
    }
  }, [trail, open, form]);

  const onSubmit = async (data: EditTrailFormData) => {
    if (!trail) return;
    
    setIsSubmitting(true);
    try {
      const updateData = { ...data };
      if (updateData.life_area === 'none') {
        updateData.life_area = null;
      }
      await updateTrail.mutateAsync({
        id: trail.id,
        ...updateData,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating trail:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Trilha</DialogTitle>
          <DialogDescription>
            Configure as informações e etapas da trilha de {trail?.profiles?.first_name} {trail?.profiles?.last_name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="stages">Etapas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4">
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
                      <FormLabel>Descrição da Trilha</FormLabel>
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
                      <FormLabel>Área da Vida</FormLabel>
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Ativa</SelectItem>
                          <SelectItem value="paused">Pausada</SelectItem>
                          <SelectItem value="completed">Finalizada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
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
          </TabsContent>
          
          <TabsContent value="stages" className="space-y-4">
            {trail && (
              <TrailStagesManager trailId={trail.id} />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};