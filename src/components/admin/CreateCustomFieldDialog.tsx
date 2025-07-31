import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { useCreateCustomProfileField, type CustomFieldType } from '@/hooks/useCustomProfileFields';

const customFieldSchema = z.object({
  field_name: z.string().min(1, 'Nome do campo é obrigatório').regex(/^[a-zA-Z0-9_]+$/, 'Use apenas letras, números e _'),
  field_label: z.string().min(1, 'Rótulo é obrigatório'),
  field_type: z.enum(['text', 'textarea', 'select', 'number', 'date']),
  is_required: z.boolean(),
});

type CustomFieldFormData = z.infer<typeof customFieldSchema>;

interface CreateCustomFieldDialogProps {
  onSuccess: () => void;
}

export const CreateCustomFieldDialog = ({ onSuccess }: CreateCustomFieldDialogProps) => {
  const [selectOptions, setSelectOptions] = useState<string[]>(['']);
  const createField = useCreateCustomProfileField();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<CustomFieldFormData>({
    resolver: zodResolver(customFieldSchema),
    defaultValues: {
      field_type: 'text',
      is_required: false,
    },
  });

  const fieldType = watch('field_type');

  const addSelectOption = () => {
    setSelectOptions([...selectOptions, '']);
  };

  const removeSelectOption = (index: number) => {
    const newOptions = selectOptions.filter((_, i) => i !== index);
    setSelectOptions(newOptions);
  };

  const updateSelectOption = (index: number, value: string) => {
    const newOptions = [...selectOptions];
    newOptions[index] = value;
    setSelectOptions(newOptions);
  };

  const onSubmit = async (data: CustomFieldFormData) => {
    const fieldOptions = fieldType === 'select' 
      ? { options: selectOptions.filter(opt => opt.trim() !== '') }
      : {};

    const maxOrderIndex = 0; // This should be calculated based on existing fields

    createField.mutate({
      ...data,
      field_options: fieldOptions,
      order_index: maxOrderIndex + 1,
    }, {
      onSuccess,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="field_name">Nome do Campo</Label>
        <Input
          id="field_name"
          {...register('field_name')}
          placeholder="ex: profissao"
        />
        {errors.field_name && (
          <p className="text-sm text-destructive">{errors.field_name.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Usado internamente. Use apenas letras, números e sublinhado.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="field_label">Rótulo</Label>
        <Input
          id="field_label"
          {...register('field_label')}
          placeholder="ex: Profissão"
        />
        {errors.field_label && (
          <p className="text-sm text-destructive">{errors.field_label.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Como o campo aparecerá para os usuários.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="field_type">Tipo do Campo</Label>
        <Select
          value={fieldType}
          onValueChange={(value: CustomFieldType) => setValue('field_type', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Texto</SelectItem>
            <SelectItem value="textarea">Texto Longo</SelectItem>
            <SelectItem value="select">Seleção</SelectItem>
            <SelectItem value="number">Número</SelectItem>
            <SelectItem value="date">Data</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {fieldType === 'select' && (
        <div className="space-y-2">
          <Label>Opções de Seleção</Label>
          {selectOptions.map((option, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={option}
                onChange={(e) => updateSelectOption(index, e.target.value)}
                placeholder="Digite uma opção"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeSelectOption(index)}
                disabled={selectOptions.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSelectOption}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Opção
          </Button>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_required"
          {...register('is_required')}
        />
        <Label htmlFor="is_required">Campo obrigatório</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Criando...' : 'Criar Campo'}
        </Button>
      </div>
    </form>
  );
};