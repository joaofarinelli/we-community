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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Eye,
  MapPin,
  Calendar,
  Clock,
  Trophy,
  Target,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Gift,
  BookOpen,
  Zap,
  Package,
  Coins,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Challenge {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  challenge_type: string;
  reward_type: string;
  reward_value: any;
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
  is_available_for_all_levels: boolean;
  required_level?: {
    level_number: number;
    level_name: string;
  };
  requirements: any;
  challenge_progress?: Array<{
    progress_value: number;
    target_value: number;
    is_completed: boolean;
    completed_at?: string | null;
  }>;
}

interface ChallengeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge: Challenge;
}

export const ChallengeDetailsDialog = ({ 
  open, 
  onOpenChange, 
  challenge 
}: ChallengeDetailsDialogProps) => {
  const userProgress = challenge.challenge_progress?.[0];
  const progressValue = userProgress?.progress_value || 0;
  const targetValue = userProgress?.target_value || (challenge.requirements as any)?.target_value || 1;
  const progressPercent = Math.min((progressValue / targetValue) * 100, 100);
  const isCompleted = userProgress?.is_completed || false;

  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
      case 'course_completion': return <BookOpen className="h-6 w-6" />;
      case 'post_creation': return <Zap className="h-6 w-6" />;
      case 'marketplace_purchase': return <Package className="h-6 w-6" />;
      case 'points_accumulation': return <Coins className="h-6 w-6" />;
      default: return <Target className="h-6 w-6" />;
    }
  };

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case 'coins': return <Coins className="h-5 w-5" />;
      case 'course_access': return <BookOpen className="h-5 w-5" />;
      case 'file_download': return <Download className="h-5 w-5" />;
      case 'marketplace_item': return <Package className="h-5 w-5" />;
      default: return <Gift className="h-5 w-5" />;
    }
  };

  const formatChallengeType = (type: string) => {
    const types = {
      'course_completion': 'Completar Cursos',
      'post_creation': 'Criar Posts',
      'marketplace_purchase': 'Fazer Compras',
      'points_accumulation': 'Acumular Pontos',
      'custom_action': 'Ação Especial'
    };
    return types[type as keyof typeof types] || type;
  };

  const formatRewardType = (type: string) => {
    const types = {
      'coins': 'WomanCoins',
      'course_access': 'Acesso a Curso',
      'file_download': 'Download',
      'marketplace_item': 'Item'
    };
    return types[type as keyof typeof types] || type;
  };

  const getStatusInfo = () => {
    if (isCompleted) {
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        label: 'Concluído',
        variant: 'secondary' as const,
        className: 'border-green-600 text-green-600'
      };
    }
    if (challenge.is_active) {
      return {
        icon: <PlayCircle className="h-5 w-5 text-blue-600" />,
        label: 'Ativo',
        variant: 'default' as const,
        className: 'border-blue-600 text-blue-600'
      };
    }
    return {
      icon: <PauseCircle className="h-5 w-5 text-gray-600" />,
      label: 'Inativo',
      variant: 'outline' as const,
      className: 'border-gray-600 text-gray-600'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detalhes do Desafio
          </DialogTitle>
          <DialogDescription>
            Visualize todas as informações sobre este desafio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Challenge Image and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {challenge.image_url ? (
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={challenge.image_url} 
                    alt={challenge.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  {getChallengeTypeIcon(challenge.challenge_type)}
                </div>
              )}
              
              <Badge variant={statusInfo.variant} className={statusInfo.className}>
                {statusInfo.icon}
                <span className="ml-2">{statusInfo.label}</span>
              </Badge>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{challenge.title}</h2>
                {challenge.description && (
                  <p className="text-muted-foreground mt-2 leading-relaxed">
                    {challenge.description}
                  </p>
                )}
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Recompensa:</span>
                    <div className="flex items-center gap-2">
                      {getRewardTypeIcon(challenge.reward_type)}
                      <span className="font-medium">
                        {challenge.reward_type === 'coins' 
                          ? `${(challenge.reward_value as any)?.amount || 0} moedas`
                          : formatRewardType(challenge.reward_type)
                        }
                      </span>
                    </div>
                  </div>
                  
                  <Badge variant="outline">
                    {formatChallengeType(challenge.challenge_type)}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Progress Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Seu Progresso</h3>
            
            <Card className={isCompleted ? "border-green-200 bg-green-50/50" : ""}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Progresso:</span>
                    <span className="text-sm font-medium">{progressValue}/{targetValue}</span>
                  </div>
                  
                  <Progress 
                    value={progressPercent} 
                    className={`h-3 ${isCompleted ? 'bg-green-100' : ''}`}
                  />
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className={isCompleted ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                      {isCompleted ? '✓ Desafio concluído!' : `${progressPercent.toFixed(1)}% concluído`}
                    </span>
                    {userProgress?.completed_at && (
                      <span className="text-muted-foreground">
                        Concluído em {format(new Date(userProgress.completed_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Gerais</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {format(new Date(challenge.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                    <p className="text-xs text-muted-foreground">Data de início</p>
                  </div>
                </div>
                
                {challenge.end_date && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(challenge.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">Data limite</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Requisitos</h3>
              <div className="space-y-3">
                {!challenge.is_available_for_all_levels && challenge.required_level && (
                  <div className="flex items-center gap-3">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        Nível {challenge.required_level.level_number}+
                      </p>
                      <p className="text-xs text-muted-foreground">Nível mínimo</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {targetValue} {challenge.challenge_type === 'course_completion' ? 'cursos' : 
                                   challenge.challenge_type === 'post_creation' ? 'posts' : 
                                   challenge.challenge_type === 'marketplace_purchase' ? 'compras' : 
                                   'ações'}
                    </p>
                    <p className="text-xs text-muted-foreground">Meta a alcançar</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};