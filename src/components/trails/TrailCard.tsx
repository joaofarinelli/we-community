import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Play, Eye, MapPin, Calendar, Lock, Image } from 'lucide-react';
import { useTrailStartEligibility } from '@/hooks/useTrailStartEligibility';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TrailCardProps {
  trail: any;
  onViewDetails?: (trail: any) => void;
  onStartTrail?: (trail: any) => void;
}

export const TrailCard = ({ trail, onViewDetails, onStartTrail }: TrailCardProps) => {
  const { canStart, unmetPrerequisites, isLoading } = useTrailStartEligibility(trail.id);

  return (
    <Card className="hover:shadow-md transition-shadow relative overflow-hidden">
      {/* Trail Thumbnail */}
      {trail.cover_url && (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={trail.cover_url} 
            alt={`Thumbnail da trilha ${trail.name}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      
      {!trail.cover_url && (
        <div className="aspect-video w-full bg-muted flex items-center justify-center">
          <Image className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      
      {/* Lock overlay for blocked trails */}
      {!canStart && (
        <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center z-10">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg">
            <Lock className="h-6 w-6 text-orange-500 mx-auto mb-1" />
            <p className="text-xs text-center font-medium">Bloqueada</p>
          </div>
        </div>
      )}
      
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{trail.name}</CardTitle>
          <div className="flex gap-1">
            <Badge variant={trail.type === 'template' ? 'secondary' : 'default'}>
              {trail.type === 'template' ? 'Template' : 'Trilha'}
            </Badge>
            {!canStart && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="destructive">
                      <Lock className="h-3 w-3 mr-1" />
                      Bloqueada
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium mb-1">Pré-requisitos não cumpridos:</p>
                    <ul className="text-xs">
                      {unmetPrerequisites.map((prereq) => (
                        <li key={prereq.id}>• {prereq.name}</li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        {trail.description && (
          <CardDescription className="line-clamp-2">
            {trail.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Details */}
        <div className="space-y-2 text-sm text-muted-foreground">
          {trail.life_area && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{trail.life_area}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              Criada em {format(new Date(trail.created_at), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>
        </div>

        {/* Prerequisites warning for blocked trails */}
        {!canStart && unmetPrerequisites.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-950/20 p-2 rounded border border-orange-200 dark:border-orange-800">
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
              Complete primeiro: {unmetPrerequisites.map(p => p.name).join(', ')}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {(onViewDetails || onStartTrail) && (
          <div className="flex gap-2">
            {onViewDetails && (
              <Button 
                variant="outline"
                onClick={() => onViewDetails(trail)}
                className="flex-1"
                size="sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </Button>
            )}
            {onStartTrail && (
              <Button 
                onClick={() => onStartTrail(trail)}
                className="flex-1"
                size="sm"
                disabled={!canStart || isLoading}
              >
                {!canStart ? (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Bloqueada
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};