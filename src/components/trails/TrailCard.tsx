import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
    <Card className="w-[291px] h-[345px] flex flex-col hover:shadow-md transition-shadow relative overflow-hidden">
      {/* Trail Thumbnail */}
      {trail.cover_url && (
        <div className="p-4">
          <div className="aspect-video w-full overflow-hidden">
            <img 
              src={trail.cover_url} 
              alt={`Thumbnail da trilha ${trail.name}`}
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}
      
      {!trail.cover_url && (
        <div className="p-4">
          <div className="aspect-video w-full bg-muted flex items-center justify-center rounded-lg">
            <Image className="h-12 w-12 text-muted-foreground" />
          </div>
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
      
      <CardContent className="p-4 flex-1 overflow-hidden">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-sm leading-tight">{trail.name}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant={trail.type === 'template' ? 'secondary' : 'default'} className="text-xs">
                    {trail.type === 'template' ? 'Template' : 'Trilha'}
                  </Badge>
                  {!canStart && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="destructive" className="text-xs">
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
            </div>
          </div>

          {trail.description && (
            <div className="text-[11px] text-muted-foreground line-clamp-2">
              {trail.description}
            </div>
          )}
        </div>
        
        {/* Details */}
        <div className="space-y-1 text-[11px] text-muted-foreground">
          {trail.life_area && (
            <div className="flex items-center gap-1">
              <span>{trail.life_area}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {format(new Date(trail.created_at), 'dd/MM/yyyy', { locale: ptBR })}
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
      </CardContent>

      {/* Action Buttons */}
      {(onViewDetails || onStartTrail) && (
        <CardFooter className="p-4 pt-0">
          <div className="flex gap-2 w-full">
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
        </CardFooter>
      )}
    </Card>
  );
};