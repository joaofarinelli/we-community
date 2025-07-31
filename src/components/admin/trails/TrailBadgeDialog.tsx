import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LucideIconSelector } from '@/components/ui/lucide-icon-selector';
import { useCreateTrailBadge, useUpdateTrailBadge, TrailBadge } from '@/hooks/useTrailBadges';

const badgeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  badge_type: z.enum(['completion', 'milestone', 'achievement']),
  icon_name: z.string().min(1, 'Ícone é obrigatório'),
  icon_color: z.string().min(1, 'Cor do ícone é obrigatória'),
  background_color: z.string().min(1, 'Cor de fundo é obrigatória'),
  coins_reward: z.number().min(0, 'Recompensa deve ser maior ou igual a 0'),
  is_active: z.boolean(),
});

type BadgeFormData = z.infer<typeof badgeSchema>;

interface TrailBadgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badge?: TrailBadge | null;
}

export const TrailBadgeDialog = ({ open, onOpenChange, badge }: TrailBadgeDialogProps) => {
  const [iconOpen, setIconOpen] = useState(false);
  const createBadge = useCreateTrailBadge();
  const updateBadge = useUpdateTrailBadge();

  const form = useForm<BadgeFormData>({
    resolver: zodResolver(badgeSchema),
    defaultValues: {
      name: '',
      description: '',
      badge_type: 'completion',
      icon_name: 'Award',
      icon_color: '#FFD700',
      background_color: '#1E40AF',
      coins_reward: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (badge) {
      form.reset({
        name: badge.name,
        description: badge.description || '',
        badge_type: badge.badge_type as 'completion' | 'milestone' | 'achievement',
        icon_name: badge.icon_name || 'Award',
        icon_color: badge.icon_color || '#FFD700',
        background_color: badge.background_color || badge.color || '#1E40AF',
        coins_reward: badge.coins_reward || 0,
        is_active: badge.is_active,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        badge_type: 'completion',
        icon_name: 'Award',
        icon_color: '#FFD700',
        background_color: '#1E40AF',
        coins_reward: 0,
        is_active: true,
      });
    }
  }, [badge, form]);

  const onSubmit = async (data: BadgeFormData) => {
    try {
      if (badge) {
        await updateBadge.mutateAsync({ id: badge.id, ...data });
      } else {
        await createBadge.mutateAsync(data);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving badge:', error);
    }
  };

  const badgeTypeOptions = [
    { value: 'completion', label: 'Conclusão' },
    { value: 'milestone', label: 'Marco' },
    { value: 'achievement', label: 'Conquista' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {badge ? 'Editar Selo' : 'Criar Novo Selo'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Selo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Primeiro Passo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="badge_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo do Selo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {badgeTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição do selo..."
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="icon_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ícone</FormLabel>
                    <FormControl>
                      <LucideIconSelector
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor do Ícone</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input type="color" className="w-12 h-10 p-1" {...field} />
                        <Input placeholder="#FFD700" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="background_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor de Fundo</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input type="color" className="w-12 h-10 p-1" {...field} />
                        <Input placeholder="#1E40AF" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="coins_reward"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recompensa em Moedas</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 mt-6">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-4 h-4"
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Selo ativo</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createBadge.isPending || updateBadge.isPending}
              >
                {createBadge.isPending || updateBadge.isPending
                  ? 'Salvando...'
                  : badge
                  ? 'Atualizar Selo'
                  : 'Criar Selo'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};