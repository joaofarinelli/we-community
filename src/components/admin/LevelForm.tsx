import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useManageLevels } from '@/hooks/useManageLevels';
import { Badge } from '@/components/ui/badge';
import * as Icons from 'lucide-react';
import { LucideProps } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const levelSchema = z.object({
  level_name: z.string().min(1, 'Nome é obrigatório'),
  min_coins_required: z.number().min(0, 'Mínimo deve ser 0 ou maior'),
  max_coins_required: z.number().optional(),
  level_color: z.string().min(1, 'Cor é obrigatória'),
  level_icon: z.string().min(1, 'Ícone é obrigatório'),
}).refine((data) => {
  if (data.max_coins_required !== undefined && data.max_coins_required <= data.min_coins_required) {
    return false;
  }
  return true;
}, {
  message: 'Máximo deve ser maior que o mínimo',
  path: ['max_coins_required']
});

type LevelFormData = z.infer<typeof levelSchema>;

interface LevelFormProps {
  level?: any;
  onSuccess?: () => void;
}

const LEVEL_COLORS = [
  '#8B5CF6', // Purple
  '#CD7F32', // Bronze
  '#C0C0C0', // Silver
  '#FFD700', // Gold
  '#B9F2FF', // Diamond
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
];

const LEVEL_ICONS = [
  'Sparkles',
  'Award',
  'Medal',
  'Trophy',
  'Crown',
  'Star',
  'Zap',
  'Target',
  'Gem',
  'Shield'
];

export const LevelForm = ({ level, onSuccess }: LevelFormProps) => {
  const { createLevel, updateLevel } = useManageLevels();
  const [selectedColor, setSelectedColor] = useState(level?.level_color || LEVEL_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(level?.level_icon || LEVEL_ICONS[0]);

  console.log('LevelForm: Received level data', { level, selectedColor, selectedIcon });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<LevelFormData>({
    resolver: zodResolver(levelSchema),
    defaultValues: {
      level_name: level?.level_name || '',
      min_coins_required: level?.min_coins_required || 0,
      max_coins_required: level?.max_coins_required || undefined,
      level_color: level?.level_color || LEVEL_COLORS[0],
      level_icon: level?.level_icon || LEVEL_ICONS[0],
    }
  });

  console.log('LevelForm: Form default values', {
    level_name: level?.level_name || '',
    min_coins_required: level?.min_coins_required || 0,
    max_coins_required: level?.max_coins_required || undefined,
    level_color: level?.level_color || LEVEL_COLORS[0],
    level_icon: level?.level_icon || LEVEL_ICONS[0],
  });

  const onSubmit = async (data: LevelFormData) => {
    console.log('LevelForm: onSubmit called', { data, level, selectedColor, selectedIcon });
    
    try {
      const formData = {
        ...data,
        level_color: selectedColor,
        level_icon: selectedIcon,
      };

      console.log('LevelForm: Prepared form data', formData);

      if (level) {
        console.log('LevelForm: Updating level', { formData, levelId: level.id });
        await updateLevel.mutateAsync({ ...formData, id: level.id });
      } else {
        console.log('LevelForm: Creating level', formData);
        await createLevel.mutateAsync(formData);
      }
      
      console.log('LevelForm: Operation successful');
      onSuccess?.();
    } catch (error) {
      console.error('LevelForm: Error in onSubmit', error);
      throw error;
    }
  };

  const SelectedIcon = selectedIcon ? (Icons as any)[selectedIcon] as React.ComponentType<LucideProps> : null;

  console.log('LevelForm: Selected icon component', { selectedIcon, SelectedIcon });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="level_name">Nome do Nível</Label>
        <Input
          id="level_name"
          placeholder="Ex: Iniciante, Bronze, Prata..."
          {...register('level_name')}
        />
        {errors.level_name && (
          <p className="text-sm text-destructive mt-1">{errors.level_name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="min_coins_required">WomanCoins Mínimas</Label>
          <Input
            id="min_coins_required"
            type="number"
            min="0"
            {...register('min_coins_required', { valueAsNumber: true })}
          />
          {errors.min_coins_required && (
            <p className="text-sm text-destructive mt-1">{errors.min_coins_required.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="max_coins_required">WomanCoins Máximas (opcional)</Label>
          <Input
            id="max_coins_required"
            type="number"
            placeholder="Deixe vazio para infinito"
            {...register('max_coins_required', { valueAsNumber: true })}
          />
          {errors.max_coins_required && (
            <p className="text-sm text-destructive mt-1">{errors.max_coins_required.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label>Cor do Nível</Label>
        <div className="flex gap-2 mt-2 flex-wrap">
          {LEVEL_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                selectedColor === color ? 'border-foreground scale-110' : 'border-muted-foreground'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => {
                setSelectedColor(color);
                setValue('level_color', color);
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <Label>Ícone do Nível</Label>
        <div className="grid grid-cols-5 gap-2 mt-2">
          {LEVEL_ICONS.map((iconName) => {
            const IconComponent = (Icons as any)[iconName] as React.ComponentType<LucideProps>;
            return (
              <button
                key={iconName}
                type="button"
                className={`p-2 rounded border transition-all ${
                  selectedIcon === iconName 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted hover:border-muted-foreground'
                }`}
                onClick={() => {
                  setSelectedIcon(iconName);
                  setValue('level_icon', iconName);
                }}
              >
                <IconComponent className="h-4 w-4 mx-auto" />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label>Preview</Label>
        <div className="mt-2">
          <Badge 
            variant="outline"
            style={{ 
              backgroundColor: `${selectedColor}15`,
              borderColor: selectedColor,
              color: selectedColor
            }}
          >
            {SelectedIcon && <SelectedIcon className="h-4 w-4 mr-1" />}
            {watch('level_name') || 'Nome do Nível'}
          </Badge>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Salvando...' : level ? 'Atualizar Nível' : 'Criar Nível'}
        </Button>
      </div>
    </form>
  );
};