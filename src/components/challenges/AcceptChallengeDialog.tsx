import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, Trophy, Target } from 'lucide-react';
import { useAcceptChallenge } from '@/hooks/useChallengeParticipations';

interface Challenge {
  id: string;
  title: string;
  description?: string;
  challenge_type: string;
  reward_type: string;
  reward_value: Record<string, any>;
  image_url?: string;
  challenge_duration_days?: number;
  challenge_duration_hours?: number;
  deadline_type?: 'duration' | 'fixed_date';
  end_date?: string;
  requirements: Record<string, any>;
  requires_submission_review?: boolean; // Added this property
}

interface AcceptChallengeDialogProps {
  challenge: Challenge | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AcceptChallengeDialog = ({ challenge, open, onOpenChange }: AcceptChallengeDialogProps) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const acceptChallenge = useAcceptChallenge();

  if (!challenge) return null;

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await acceptChallenge.mutateAsync({
        challengeId: challenge.id,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao aceitar desafio:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  const getExpirationDate = () => {
    if (challenge.deadline_type === 'fixed_date' && challenge.end_date) {
      return new Date(challenge.end_date).toLocaleDateString('pt-BR');
    }
    const expireDate = new Date();
    const days = challenge.challenge_duration_days ?? 0;
    const hours = challenge.challenge_duration_hours ?? 0;
    if (days) expireDate.setDate(expireDate.getDate() + days);
    if (hours) expireDate.setHours(expireDate.getHours() + hours);
    return expireDate.toLocaleDateString('pt-BR');
  };

  const getChallengeTypeLabel = (type: string) => {
    const types = {
      'custom_goal': 'Meta Personalizada',
      'course_completion': 'Conclusão de Curso',
      'post_creation': 'Criação de Posts',
      'marketplace_purchase': 'Compra no Marketplace',
      'custom_action': 'Ação Personalizada',
      'points_accumulation': 'Acúmulo de Pontos'
    };
    return types[type as keyof typeof types] || type;
  };

  const getRewardTypeLabel = (type: string) => {
    const types = {
      'coins': 'Moedas',
      'course_access': 'Acesso a Curso',
      'file_download': 'Download de Arquivo',
      'marketplace_item': 'Item do Marketplace'
    };
    return types[type as keyof typeof types] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Aceitar Desafio
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Challenge Image */}
          {challenge.image_url && (
            <div className="w-full h-48 rounded-lg overflow-hidden">
              <img 
                src={challenge.image_url} 
                alt={challenge.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Challenge Info */}
          <div>
            <h3 className="text-xl font-semibold mb-2">{challenge.title}</h3>
            {challenge.description && (
              <p className="text-muted-foreground mb-4">{challenge.description}</p>
            )}
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary">
                {getChallengeTypeLabel(challenge.challenge_type)}
              </Badge>
            </div>
          </div>

          {/* Challenge Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium">Prazo</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {challenge.deadline_type === 'fixed_date'
                    ? 'Até ' + getExpirationDate()
                    : `${challenge.challenge_duration_days ?? 0} dias${(challenge.challenge_duration_hours ?? 0) > 0 ? ` e ${challenge.challenge_duration_hours} horas` : ''} para completar`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium">Data Limite</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getExpirationDate()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="font-medium">Recompensa</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getRewardTypeLabel(challenge.reward_type)}
                  {challenge.reward_type === 'coins' && ` (${challenge.reward_value.amount} moedas)`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="font-medium">Objetivo</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {challenge.requirements.description || 'Complete o desafio conforme descrito'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Requirements */}
          {challenge.requirements.proof_types && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Provas Aceitas:</h4>
                <div className="flex flex-wrap gap-2">
                  {challenge.requirements.proof_types.map((type: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {type === 'text' && 'Texto'}
                      {type === 'image' && 'Imagem'}
                      {type === 'file' && 'Arquivo'}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAccept}
              disabled={isAccepting}
            >
              {isAccepting ? 'Aceitando...' : 'Aceitar Desafio'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};