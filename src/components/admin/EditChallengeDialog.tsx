import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/ui/image-upload';
import { useUpdateChallenge } from '@/hooks/useManageChallenges';
import { useCompanyLevels } from '@/hooks/useCompanyLevels';
import { Coins, BookOpen, Download, Package } from 'lucide-react';

interface EditChallengeDialogProps {
  challenge: any;
  open: boolean;
  onClose: () => void;
}

export const EditChallengeDialog = ({ challenge, open, onClose }: EditChallengeDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [challengeType, setChallengeType] = useState<string>('');
  const [rewardType, setRewardType] = useState<string>('');
  const [targetValue, setTargetValue] = useState<number>(1);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [digitalUrl, setDigitalUrl] = useState<string>('');
  const [maxParticipants, setMaxParticipants] = useState<number | undefined>();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isAvailableForAllLevels, setIsAvailableForAllLevels] = useState<boolean>(true);
  const [requiredLevelId, setRequiredLevelId] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [requiresSubmissionReview, setRequiresSubmissionReview] = useState<boolean>(true);

  // Deadline
  const [deadlineType, setDeadlineType] = useState<'duration' | 'fixed_date'>('duration');
  const [durationDays, setDurationDays] = useState<number>(7);
  const [durationHours, setDurationHours] = useState<number>(0);
  const [endDate, setEndDate] = useState<string>('');

  const updateChallenge = useUpdateChallenge();
  const { data: levels } = useCompanyLevels();

  // Populate form when challenge prop changes
  useEffect(() => {
    if (challenge) {
      setTitle(challenge.title || '');
      setDescription(challenge.description || '');
      setChallengeType(challenge.challenge_type || '');
      setRewardType(challenge.reward_type || '');
      setTargetValue((challenge.requirements as any)?.target_value || 1);
      setRewardAmount((challenge.reward_value as any)?.amount || 0);
      setDigitalUrl((challenge.reward_value as any)?.url || '');
      setMaxParticipants(challenge.max_participants || undefined);
      setImageUrl(challenge.image_url || '');
      setIsAvailableForAllLevels(challenge.is_available_for_all_levels ?? true);
      setRequiredLevelId(challenge.required_level_id || '');
      setIsActive(challenge.is_active ?? true);
      setRequiresSubmissionReview(challenge.requires_submission_review ?? true);

      const type = challenge.deadline_type || (challenge.end_date ? 'fixed_date' : 'duration');
      setDeadlineType(type);
      setDurationDays(challenge.challenge_duration_days ?? 0);
      setDurationHours(challenge.challenge_duration_hours ?? 0);
      setEndDate(challenge.end_date ? new Date(challenge.end_date).toISOString().slice(0, 16) : '');
    }
  }, [challenge]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !challengeType || !rewardType) return;

    const rewardValue = rewardType === 'coins'
      ? { amount: rewardAmount }
      : rewardType === 'file_download'
      ? { url: digitalUrl }
      : {};

    const updates = {
      title,
      description,
      challenge_type: challengeType as any,
      requirements: { target_value: targetValue },
      reward_type: rewardType as any,
      reward_value: rewardValue,
      max_participants: maxParticipants,
      // Deadline
      deadline_type: deadlineType,
      challenge_duration_days: deadlineType === 'duration' ? durationDays : undefined,
      challenge_duration_hours: deadlineType === 'duration' ? durationHours : undefined,
      end_date: deadlineType === 'fixed_date' ? (endDate || undefined) : undefined,
      image_url: imageUrl || undefined,
      is_available_for_all_levels: isAvailableForAllLevels,
      required_level_id: isAvailableForAllLevels ? undefined : requiredLevelId || undefined,
      is_active: isActive,
      requires_submission_review: requiresSubmissionReview
    };

    try {
      await updateChallenge.mutateAsync({ id: challenge.id, updates });
      onClose();
    } catch (error) {
      console.error('Error updating challenge:', error);
    }
  };

  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
      case 'course_completion': return <BookOpen className="h-4 w-4" />;
      case 'post_creation': return <Package className="h-4 w-4" />;
      case 'marketplace_purchase': return <Package className="h-4 w-4" />;
      case 'points_accumulation': return <Coins className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case 'coins': return <Coins className="h-4 w-4" />;
      case 'course_access': return <BookOpen className="h-4 w-4" />;
      case 'file_download': return <Download className="h-4 w-4" />;
      case 'marketplace_item': return <Package className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Desafio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nome do desafio"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetValue">Meta</Label>
              <Input
                id="targetValue"
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                min="1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o desafio"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Desafio</Label>
              <Select value={challengeType} onValueChange={setChallengeType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course_completion">
                    <div className="flex items-center gap-2">
                      {getChallengeTypeIcon('course_completion')}
                      Completar Cursos
                    </div>
                  </SelectItem>
                  <SelectItem value="post_creation">
                    <div className="flex items-center gap-2">
                      {getChallengeTypeIcon('post_creation')}
                      Criar Posts
                    </div>
                  </SelectItem>
                  <SelectItem value="marketplace_purchase">
                    <div className="flex items-center gap-2">
                      {getChallengeTypeIcon('marketplace_purchase')}
                      Compras no Marketplace
                    </div>
                  </SelectItem>
                  <SelectItem value="points_accumulation">
                    <div className="flex items-center gap-2">
                      {getChallengeTypeIcon('points_accumulation')}
                      Acumular Pontos
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Recompensa</Label>
              <Select value={rewardType} onValueChange={setRewardType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a recompensa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coins">
                    <div className="flex items-center gap-2">
                      {getRewardTypeIcon('coins')}
                      WomanCoins
                    </div>
                  </SelectItem>
                  <SelectItem value="course_access">
                    <div className="flex items-center gap-2">
                      {getRewardTypeIcon('course_access')}
                      Acesso a Curso
                    </div>
                  </SelectItem>
                  <SelectItem value="file_download">
                    <div className="flex items-center gap-2">
                      {getRewardTypeIcon('file_download')}
                      Download de Arquivo
                    </div>
                  </SelectItem>
                  <SelectItem value="marketplace_item">
                    <div className="flex items-center gap-2">
                      {getRewardTypeIcon('marketplace_item')}
                      Item do Marketplace
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {rewardType === 'coins' && (
            <div className="space-y-2">
              <Label htmlFor="rewardAmount">Quantidade de WomanCoins</Label>
              <Input
                id="rewardAmount"
                type="number"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(Number(e.target.value))}
                min="1"
                required
              />
            </div>
          )}

          {rewardType === 'file_download' && (
            <div className="space-y-2">
              <Label htmlFor="digitalUrl">Link da Entrega (URL)</Label>
              <Input
                id="digitalUrl"
                type="url"
                value={digitalUrl}
                onChange={(e) => setDigitalUrl(e.target.value)}
                placeholder="https://..."
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Imagem do Desafio (opcional)</Label>
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              onRemove={() => setImageUrl('')}
              bucketName="challenge-images"
            />
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="allLevels"
                checked={isAvailableForAllLevels}
                onCheckedChange={setIsAvailableForAllLevels}
              />
              <Label htmlFor="allLevels">Disponível para todos os níveis</Label>
            </div>

            {!isAvailableForAllLevels && (
              <div className="space-y-2">
                <Label>Nível Mínimo Requerido</Label>
                <Select value={requiredLevelId} onValueChange={setRequiredLevelId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível mínimo" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels?.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.level_name} (Nível {level.level_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive">Desafio ativo</Label>
            </div>

            {challengeType === 'proof_based' && (
              <div className="space-y-2 border rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requiresReview"
                    checked={requiresSubmissionReview}
                    onCheckedChange={setRequiresSubmissionReview}
                  />
                  <Label htmlFor="requiresReview">Requer análise das submissões?</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {requiresSubmissionReview 
                    ? "As submissões ficarão pendentes até serem aprovadas por um admin." 
                    : "As submissões serão aprovadas automaticamente ao serem enviadas."}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <Label>Prazo do Desafio</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Prazo</Label>
                <Select value={deadlineType} onValueChange={(v: 'duration' | 'fixed_date') => setDeadlineType(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de prazo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="duration">Após aceitar (dias/horas)</SelectItem>
                    <SelectItem value="fixed_date">Data fixa máxima</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {deadlineType === 'duration' && (
                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                  <div className="space-y-2">
                    <Label htmlFor="durationDays">Dias</Label>
                    <Input
                      id="durationDays"
                      type="number"
                      min="0"
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="durationHours">Horas</Label>
                    <Input
                      id="durationHours"
                      type="number"
                      min="0"
                      max="23"
                      value={durationHours}
                      onChange={(e) => setDurationHours(Number(e.target.value))}
                    />
                  </div>
                </div>
              )}

              {deadlineType === 'fixed_date' && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endDate">Data de Término</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Máximo de Participantes (opcional)</Label>
              <Input
                id="maxParticipants"
                type="number"
                value={maxParticipants || ''}
                onChange={(e) => setMaxParticipants(e.target.value ? Number(e.target.value) : undefined)}
                min="1"
                placeholder="Ilimitado"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateChallenge.isPending}>
              {updateChallenge.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};