import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useTrailStartEligibility } from '@/hooks/useTrailStartEligibility';
import { 
  Eye,
  MapPin,
  Calendar,
  Clock,
  Trophy,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Users,
  Target,
  Rocket,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TrailTemplate {
  id: string;
  name: string;
  description?: string | null;
  life_area?: string | null;
  difficulty_level: string;
  estimated_duration_days?: number | null;
  auto_complete: boolean;
  is_active: boolean;
  order_index: number;
  created_at: string;
  completion_badge?: {
    name: string;
    description: string;
    icon_type: string;
    icon_value: string;
    color: string;
    coins_reward: number;
  };
  trail_stages?: Array<{
    id: string;
    name: string;
    description: string;
    order_index: number;
  }>;
}

interface TrailTemplateDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trailTemplate: TrailTemplate;
  onStartTrail?: (template: TrailTemplate) => void;
}

export const TrailTemplateDetailsDialog = ({ 
  open, 
  onOpenChange, 
  trailTemplate,
  onStartTrail 
}: TrailTemplateDetailsDialogProps) => {
  const { canStart, unmetPrerequisites, isLoading } = useTrailStartEligibility(trailTemplate?.id || '');
  
  const getDifficultyInfo = (level: string) => {
    switch (level) {
      case 'beginner':
        return {
          label: 'Iniciante',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <Target className="h-4 w-4" />
        };
      case 'intermediate':
        return {
          label: 'Intermediário',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Trophy className="h-4 w-4" />
        };
      case 'advanced':
        return {
          label: 'Avançado',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <Rocket className="h-4 w-4" />
        };
      default:
        return {
          label: level,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Target className="h-4 w-4" />
        };
    }
  };

  const difficultyInfo = getDifficultyInfo(trailTemplate.difficulty_level);
  const stagesCount = trailTemplate.trail_stages?.length || 0;

  const handleStartTrail = () => {
    onStartTrail?.(trailTemplate);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detalhes da Trilha
          </DialogTitle>
          <DialogDescription>
            Visualize todas as informações sobre esta trilha disponível
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trail Basic Info */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">{trailTemplate.name}</h2>
              {trailTemplate.description && (
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  {trailTemplate.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={difficultyInfo.color}>
                {difficultyInfo.icon}
                <span className="ml-1">{difficultyInfo.label}</span>
              </Badge>
              
              {trailTemplate.life_area && (
                <Badge variant="outline">
                  <MapPin className="h-3 w-3 mr-1" />
                  {trailTemplate.life_area}
                </Badge>
              )}
              
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {stagesCount} {stagesCount === 1 ? 'etapa' : 'etapas'}
              </Badge>
              
              {trailTemplate.auto_complete && (
                <Badge variant="secondary">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Auto-conclusão
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Prerequisites Section */}
          {unmetPrerequisites.length > 0 && (
            <>
              <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-orange-700 dark:text-orange-300 mb-3">
                  <Lock className="h-5 w-5" />
                  Pré-requisitos Não Cumpridos
                </h3>
                <p className="text-orange-600 dark:text-orange-400 mb-2">
                  Para iniciar esta jornada, você precisa concluir primeiro:
                </p>
                <div className="flex flex-wrap gap-2">
                  {unmetPrerequisites.map((prerequisite) => (
                    <Badge key={prerequisite.id} variant="outline" className="border-orange-300 text-orange-700 dark:text-orange-300">
                      {prerequisite.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Trail Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Gerais</h3>
              <div className="space-y-3">
                {trailTemplate.estimated_duration_days && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {trailTemplate.estimated_duration_days} dias
                      </p>
                      <p className="text-xs text-muted-foreground">Duração estimada</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {format(new Date(trailTemplate.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                    <p className="text-xs text-muted-foreground">Data de criação</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {trailTemplate.auto_complete ? 'Automática' : 'Manual'}
                    </p>
                    <p className="text-xs text-muted-foreground">Conclusão</p>
                  </div>
                </div>
              </div>
            </div>

            {trailTemplate.completion_badge && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recompensa de Conclusão</h3>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: trailTemplate.completion_badge.color }}
                      >
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{trailTemplate.completion_badge.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {trailTemplate.completion_badge.description}
                        </p>
                      </div>
                    </div>
                    
                    {trailTemplate.completion_badge.coins_reward > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Trophy className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          +{trailTemplate.completion_badge.coins_reward} moedas
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Trail Stages */}
          {trailTemplate.trail_stages && trailTemplate.trail_stages.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Etapas da Trilha</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {trailTemplate.trail_stages
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((stage, index) => (
                      <Card key={stage.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{stage.name}</h4>
                              {stage.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {stage.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            </>
          )}

          {/* Getting Started Info */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Rocket className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-primary mb-1">Pronto para começar?</h4>
                  <p className="text-sm text-muted-foreground">
                    Esta trilha foi criada para te guiar em uma jornada de desenvolvimento. 
                    Clique em "Iniciar Trilha" para começar sua jornada agora mesmo!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Fechar
          </Button>
          {trailTemplate.is_active && (
            <Button 
              onClick={handleStartTrail}
              className="w-full sm:w-auto"
              disabled={!canStart || isLoading}
            >
              <Rocket className="h-4 w-4 mr-2" />
              {!canStart ? 'Jornada Bloqueada' : 'Iniciar Trilha'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};