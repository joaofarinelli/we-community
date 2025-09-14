import { useState } from 'react';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreateCustomFieldDialog } from './CreateCustomFieldDialog';
import { EditCustomFieldDialog } from './EditCustomFieldDialog';
import { 
  useCustomProfileFields, 
  useDeleteCustomProfileField,
  type CustomProfileField 
} from '@/hooks/useCustomProfileFields';
import { toast } from 'sonner';

export const CustomProfileFieldsManagement = () => {
  const [selectedField, setSelectedField] = useState<CustomProfileField | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: fields = [], isLoading } = useCustomProfileFields();
  const deleteField = useDeleteCustomProfileField();

  const handleEdit = (field: CustomProfileField) => {
    setSelectedField(field);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (field: CustomProfileField) => {
    if (window.confirm(`Tem certeza que deseja excluir o campo "${field.field_label}"?`)) {
      deleteField.mutate(field.id);
    }
  };

  const getFieldTypeLabel = (type: string) => {
    const labels = {
      text: 'Texto',
      textarea: 'Texto Longo',
      select: 'Seleção',
      number: 'Número',
      date: 'Data'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Campos Personalizados do Perfil</h2>
          <p className="text-muted-foreground">
            Gerencie os campos personalizados que aparecem no perfil dos usuários
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Campo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Campo Personalizado</DialogTitle>
            </DialogHeader>
            <CreateCustomFieldDialog onSuccess={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Nenhum campo personalizado criado ainda.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Campo
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {fields.map((field) => (
            <Card key={field.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{field.field_label}</h3>
                        <Badge variant="secondary">
                          {getFieldTypeLabel(field.field_type)}
                        </Badge>
                        {field.is_required && (
                          <Badge variant="destructive">Obrigatório</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Nome interno: {field.field_name}
                      </p>
                      {field.field_type === 'select' && field.field_options && (
                        <p className="text-sm text-muted-foreground">
                          Opções: {((field.field_options as any)?.options || []).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(field as CustomProfileField)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(field as CustomProfileField)}
                      disabled={deleteField.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedField && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Campo Personalizado</DialogTitle>
            </DialogHeader>
            <EditCustomFieldDialog 
              field={selectedField}
              onSuccess={() => setIsEditDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};