import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSpaceTypeInfo, type SpaceType } from '@/lib/spaceUtils';
import { spaceConfigurationSchema, type SpaceConfigurationFormData } from '@/lib/schemas';
import { useSpaceCategories } from '@/hooks/useSpaceCategories';
import { Globe, Lock, EyeOff, Bell } from 'lucide-react';

interface SpaceConfigurationDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateSpace: (data: SpaceConfigurationFormData) => void;
  selectedType: SpaceType | null;
  selectedCategoryId: string | null;
  isCreating: boolean;
}

export const SpaceConfigurationDialog = ({
  open,
  onClose,
  onCreateSpace,
  selectedType,
  selectedCategoryId,
  isCreating,
}: SpaceConfigurationDialogProps) => {
  const { data: categories = [] } = useSpaceCategories();
  const spaceTypeInfo = selectedType ? getSpaceTypeInfo(selectedType) : null;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SpaceConfigurationFormData>({
    resolver: zodResolver(spaceConfigurationSchema),
    defaultValues: {
      categoryId: selectedCategoryId || '',
      accessLevel: 'open' as const,
      enableNotifications: true,
    },
  });

  const accessLevel = watch('accessLevel');
  const enableNotifications = watch('enableNotifications');

  const onSubmit = (data: SpaceConfigurationFormData) => {
    onCreateSpace(data);
  };

  const accessLevels = [
    {
      value: 'open',
      label: 'Aberto',
      description: 'Qualquer membro pode ver e participar',
      icon: Globe,
    },
    {
      value: 'private',
      label: 'Privado',
      description: 'Apenas membros convidados podem ver',
      icon: Lock,
    },
    {
      value: 'secret',
      label: 'Secreto',
      description: 'Invisível para não-membros',
      icon: EyeOff,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-3">
            {spaceTypeInfo && (
              <>
                <div className="p-2 rounded-full bg-primary text-primary-foreground">
                  <spaceTypeInfo.icon className="h-5 w-5" />
                </div>
                Criar {spaceTypeInfo.name}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nome do Espaço */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do espaço</Label>
            <Input
              id="name"
              placeholder="Digite o nome do espaço"
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={watch('categoryId')}
              onValueChange={(value) => setValue('categoryId', value)}
            >
              <SelectTrigger className={errors.categoryId ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-destructive">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Nível de Acesso */}
          <div className="space-y-3">
            <Label>Nível de acesso</Label>
            <RadioGroup
              value={accessLevel}
              onValueChange={(value) => setValue('accessLevel', value as any)}
              className="space-y-3"
            >
              {accessLevels.map((level) => {
                const Icon = level.icon;
                return (
                  <div key={level.value} className="flex items-start space-x-3">
                    <RadioGroupItem value={level.value} id={level.value} className="mt-1" />
                    <div className="flex-1">
                      <Label
                        htmlFor={level.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{level.label}</span>
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {level.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
            {errors.accessLevel && (
              <p className="text-sm text-destructive">{errors.accessLevel.message}</p>
            )}
          </div>

          {/* Notificações */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="notifications"
              checked={enableNotifications}
              onCheckedChange={(checked) => setValue('enableNotifications', !!checked)}
            />
            <div className="flex-1">
              <Label htmlFor="notifications" className="flex items-center gap-2 cursor-pointer">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span>Ativar notificações</span>
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Receba notificações sobre atividades neste espaço
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating} className="px-8">
              {isCreating ? 'Criando...' : 'Criar espaço'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};