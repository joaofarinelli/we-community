import { useState } from 'react';
import { Edit, Trash2, Copy, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTrailTemplates, useDeleteTrailTemplate } from '@/hooks/useTrailTemplates';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const TrailTemplatesTab = () => {
  const { data: templates, isLoading } = useTrailTemplates();
  const deleteTemplate = useDeleteTrailTemplate();

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja desativar este template?')) {
      await deleteTemplate.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground mb-4">
            Nenhum template criado ainda.
          </p>
          <p className="text-sm text-muted-foreground">
            Crie templates reutilizáveis para facilitar a criação de trilhas pelas usuárias.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <Card key={template.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <Badge variant="secondary">Template</Badge>
            </div>
            {template.description && (
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Details */}
            <div className="space-y-2 text-sm text-muted-foreground">
              {template.life_area && (
                <div>
                  <span className="font-medium">Área da vida:</span> {template.life_area}
                </div>
              )}
              <div>
                <span className="font-medium">Criado em:</span>{' '}
                {format(new Date(template.created_at), 'dd/MM/yyyy', { locale: ptBR })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Eye className="h-4 w-4 mr-1" />
                Ver
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDelete(template.id)}
                disabled={deleteTemplate.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};