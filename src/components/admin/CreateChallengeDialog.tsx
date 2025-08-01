import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/ui/image-upload';
import { useCreateChallenge } from '@/hooks/useManageChallenges';
import { useCompanyLevels } from '@/hooks/useCompanyLevels';
import { useTags } from '@/hooks/useTags';
import { Plus, Coins, BookOpen, Download, Package, Tag, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const CreateChallengeDialog = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [challengeType, setChallengeType] = useState<string>('');
  const [rewardType, setRewardType] = useState<string>('');
  const [targetValue, setTargetValue] = useState<number>(1);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [maxParticipants, setMaxParticipants] = useState<number | undefined>();
  const [endDate, setEndDate] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isAvailableForAllLevels, setIsAvailableForAllLevels] = useState<boolean>(true);
  const [requiredLevelId, setRequiredLevelId] = useState<string>('');
  const [accessTags, setAccessTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');

  const createChallenge = useCreateChallenge();
  const { data: levels } = useCompanyLevels();
  const { data: tags } = useTags();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !challengeType || !rewardType) return;

    const challengeData = {
      title,
      description,
      challenge_type: challengeType as any,
      requirements: { target_value: targetValue },
      reward_type: rewardType as any,
      reward_value: { amount: rewardAmount },
      max_participants: maxParticipants,
      end_date: endDate || undefined,
      image_url: imageUrl || undefined,
      is_available_for_all_levels: isAvailableForAllLevels,
      required_level_id: isAvailableForAllLevels ? undefined : requiredLevelId || undefined,
      access_tags: accessTags
    };

    try {
      await createChallenge.mutateAsync(challengeData);
      setOpen(false);
      // Reset form
      setTitle('');
      setDescription('');
      setChallengeType('');
      setRewardType('');
      setTargetValue(1);
      setRewardAmount(0);
      setMaxParticipants(undefined);
      setEndDate('');
      setImageUrl('');
      setIsAvailableForAllLevels(true);
      setRequiredLevelId('');
      setAccessTags([]);
      setSelectedTag('');
    } catch (error) {
      console.error('Error creating challenge:', error);
    }
  };

  const addAccessTag = () => {
    if (selectedTag && !accessTags.includes(selectedTag)) {
      setAccessTags([...accessTags, selectedTag]);
      setSelectedTag('');
    }
  };

  const removeAccessTag = (tagToRemove: string) => {
    setAccessTags(accessTags.filter(tag => tag !== tagToRemove));
  };

  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
      case 'course_completion': return <BookOpen className="h-4 w-4" />;
      case 'post_creation': return <Plus className="h-4 w-4" />;
      case 'marketplace_purchase': return <Package className="h-4 w-4" />;
      case 'points_accumulation': return <Coins className="h-4 w-4" />;
      default: return <Plus className="h-4 w-4" />;
    }
  };

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case 'coins': return <Coins className="h-4 w-4" />;
      case 'course_access': return <BookOpen className="h-4 w-4" />;
      case 'file_download': return <Download className="h-4 w-4" />;
      case 'marketplace_item': return <Package className="h-4 w-4" />;
      default: return <Plus className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Criar Desafio
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Desafio</DialogTitle>
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

          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4" />
              <Label>Acesso por Tags</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Defina quais tags podem acessar este desafio. Deixe vazio para permitir acesso a todos.
            </p>
            
            <div className="flex space-x-2">
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione uma tag" />
                </SelectTrigger>
                <SelectContent>
                  {tags?.filter(tag => !accessTags.includes(tag.name)).map((tag) => (
                    <SelectItem key={tag.id} value={tag.name}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                variant="outline" 
                onClick={addAccessTag}
                disabled={!selectedTag}
              >
                Adicionar
              </Button>
            </div>

            {accessTags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tags Selecionadas:</Label>
                <div className="flex flex-wrap gap-2">
                  {accessTags.map((tagName) => {
                    const tag = tags?.find(t => t.name === tagName);
                    return (
                      <Badge 
                        key={tagName} 
                        variant="secondary" 
                        className="flex items-center gap-1"
                      >
                        {tag && (
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                        )}
                        {tagName}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-red-500" 
                          onClick={() => removeAccessTag(tagName)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
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
            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Término (opcional)</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createChallenge.isPending}>
              {createChallenge.isPending ? 'Criando...' : 'Criar Desafio'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};