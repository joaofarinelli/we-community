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
import { useCreateTrail } from '@/hooks/useTrails';
import { useCompanyMembers } from '@/hooks/useCompanyMembers';

const createTrailSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  life_area: z.string().optional(),
  user_id: z.string().optional(), // For assigning to specific user
  template_id: z.string().optional(),
});

type CreateTrailFormData = z.infer<typeof createTrailSchema>;

interface CreateTrailForUserDialogProps {
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

export const CreateTrailForUserDialog = ({ open, onOpenChange }: CreateTrailForUserDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createTrail = useCreateTrail();
  const { data: members } = useCompanyMembers();

  const form = useForm<CreateTrailFormData>({
    resolver: zodResolver(createTrailSchema),
    defaultValues: {
      name: '',
      description: '',
      life_area: 'none',
      user_id: 'all',
    },
  });

  const onSubmit = async (data: CreateTrailFormData) => {
    setIsSubmitting(true);
    try {
      const createData = { ...data };
      if (createData.life_area === 'none') {
        createData.life_area = null;
      }
      if (createData.user_id === 'all') {
        createData.user_id = null;
      }
      await createTrail.mutateAsync(createData);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating trail:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter out admins and owners from member list
  const regularMembers = members?.filter(member => 
    member.role !== 'owner' && member.role !== 'admin'
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Trilha para Usuária</DialogTitle>
          <DialogDescription>
            Crie uma trilha específica para uma usuária ou use um template existente.
          </DialogDescription>
        </DialogHeader>

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
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Atribuir a Usuária (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma usuária" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">Disponível para todas</SelectItem>
                      {regularMembers.map((member) => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.display_name || member.email}
                        </SelectItem>
                      ))}
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
                {isSubmitting ? 'Criando...' : 'Criar Trilha'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};