import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrailTemplate } from '@/hooks/useTrailTemplates';

interface ViewTrailTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TrailTemplate | null;
}

export const ViewTrailTemplateDialog = ({ open, onOpenChange, template }: ViewTrailTemplateDialogProps) => {
  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {template.name}
            <Badge variant="secondary">Template</Badge>
          </DialogTitle>
          <DialogDescription>
            Detalhes do template de trilha
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {template.cover_url && (
                <div>
                  <span className="font-medium text-sm">Imagem de Capa:</span>
                  <div className="mt-2 w-full h-48 bg-muted rounded-lg overflow-hidden">
                    <img 
                      src={template.cover_url} 
                      alt={`Capa do template ${template.name}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div>
                <span className="font-medium text-sm">Nome:</span>
                <p className="text-foreground">{template.name}</p>
              </div>
              
              {template.description && (
                <div>
                  <span className="font-medium text-sm">Descrição:</span>
                  <p className="text-foreground">{template.description}</p>
                </div>
              )}
              
              {template.life_area && (
                <div>
                  <span className="font-medium text-sm">Área da vida:</span>
                  <p className="text-foreground">{template.life_area}</p>
                </div>
              )}
              
              <div>
                <span className="font-medium text-sm">Criado em:</span>
                <p className="text-foreground">
                  {template.created_at && !isNaN(new Date(template.created_at).getTime())
                    ? format(new Date(template.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                    : 'Data não disponível'
                  }
                </p>
              </div>
              
              {template.updated_at !== template.created_at && template.updated_at && !isNaN(new Date(template.updated_at).getTime()) && (
                <div>
                  <span className="font-medium text-sm">Atualizado em:</span>
                  <p className="text-foreground">
                    {format(new Date(template.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              )}
              
              <div>
                <span className="font-medium text-sm">Status:</span>
                <Badge variant={template.is_active ? "default" : "secondary"} className="ml-2">
                  {template.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};