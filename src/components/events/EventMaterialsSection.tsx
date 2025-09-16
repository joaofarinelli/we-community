import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Eye, EyeOff } from 'lucide-react';
import { useEventMaterials } from '@/hooks/useEventMaterials';
import { useCanEditEvent } from '@/hooks/useCanEditEvent';
import { EventMaterialCard } from './EventMaterialCard';
import { EventMaterialUploader } from './EventMaterialUploader';

interface EventMaterialsSectionProps {
  event: {
    id: string;
    space_id: string;
    created_by: string;
    status?: string;
  };
}

export const EventMaterialsSection = ({ event }: EventMaterialsSectionProps) => {
  const [showUploader, setShowUploader] = useState(false);
  const [showAll, setShowAll] = useState(false);
  
  const { data: materials, isLoading } = useEventMaterials(event.id);
  const canEdit = useCanEditEvent(event);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Materiais do Evento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const visibleMaterials = materials?.filter(m => m.is_visible_to_participants) || [];
  const hiddenMaterials = materials?.filter(m => !m.is_visible_to_participants) || [];
  const displayMaterials = showAll ? materials : visibleMaterials;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Materiais do Evento
            <Badge variant="secondary" className="ml-2">
              {materials?.length || 0}
            </Badge>
          </CardTitle>
          
          <div className="flex gap-2">
            {canEdit && hiddenMaterials.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Ocultar privados
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Ver todos ({hiddenMaterials.length} ocultos)
                  </>
                )}
              </Button>
            )}
            
            {canEdit && (
              <Button
                size="sm"
                onClick={() => setShowUploader(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Material
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {showUploader && (
          <div className="mb-6">
            <EventMaterialUploader
              eventId={event.id}
              onClose={() => setShowUploader(false)}
            />
          </div>
        )}

        {!materials || materials.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Nenhum material disponível</p>
            {canEdit && (
              <p className="text-sm text-muted-foreground">
                Adicione materiais para que os participantes possam acessá-los
              </p>
            )}
          </div>
        ) : displayMaterials?.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum material visível para participantes</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {displayMaterials?.map((material) => (
              <EventMaterialCard
                key={material.id}
                material={material}
                event={event}
              />
            ))}
          </div>
        )}

        {canEdit && !showAll && hiddenMaterials.length > 0 && (
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {hiddenMaterials.length} materiais ocultos para participantes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};