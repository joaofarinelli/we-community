import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, MapPin, PlayCircle, CheckCircle, PauseCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Trail } from '@/hooks/useTrails';
import { TrailDetailDialog } from './TrailDetailDialog';

interface TrailCardProps {
  trail: Trail;
}

export const TrailCard = ({ trail }: TrailCardProps) => {
  const navigate = useNavigate();
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <PlayCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'paused':
        return <PauseCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'paused':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'completed':
        return 'Concluída';
      case 'paused':
        return 'Pausada';
      default:
        return status;
    }
  };

  const handleContinueTrail = () => {
    navigate(`/dashboard/trails/${trail.id}/stages`);
  };

  const handleViewDetails = () => {
    setShowDetailDialog(true);
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{trail.name}</CardTitle>
          <Badge variant={getStatusVariant(trail.status)}>
            {getStatusIcon(trail.status)}
            <span className="ml-1">{getStatusLabel(trail.status)}</span>
          </Badge>
        </div>
        {trail.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {trail.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progresso</span>
            <span className="font-medium">{trail.progress_percentage}%</span>
          </div>
          <Progress value={trail.progress_percentage} className="h-2" />
        </div>

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
              Iniciada em {format(new Date(trail.started_at), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>
          {trail.completed_at && (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>
                Concluída em {format(new Date(trail.completed_at), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleViewDetails}
          >
            Ver Detalhes
          </Button>
          {trail.status === 'active' && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={handleContinueTrail}
            >
              Continuar
            </Button>
          )}
        </div>
      </CardContent>

      <TrailDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        trail={trail}
        onContinue={handleContinueTrail}
      />
    </Card>
  );
};