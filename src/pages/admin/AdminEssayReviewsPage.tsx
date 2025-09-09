import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { usePendingEssayReviews, useReviewEssayAnswer, useCompanyEssayReviews, EssayReviewFilters } from '@/hooks/useEssayQuestionReviews';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { useTags } from '@/hooks/useTags';
import { useCompanyLevels } from '@/hooks/useCompanyLevels';
import { useTrailBadges } from '@/hooks/useTrailBadges';
import { PendingReviewsNotification } from '@/components/admin/PendingReviewsNotification';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, XCircle, Clock, User, BookOpen, FileText, Award, Filter, X, Search } from 'lucide-react';

export const AdminEssayReviewsPage = () => {
  const { currentCompanyId } = useCompanyContext();
  
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [pointsEarned, setPointsEarned] = useState<number>(0);
  
  // Filter states
  const [filters, setFilters] = useState<EssayReviewFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [userNameSearch, setUserNameSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  
  // Fetch filter options
  const { data: tags = [] } = useTags();
  const { data: levels = [] } = useCompanyLevels();
  const { data: badges = [] } = useTrailBadges();
  
  // Apply filters to queries
  const currentFilters: EssayReviewFilters = {
    userName: userNameSearch || undefined,
    tagIds: selectedTags.length > 0 ? selectedTags : undefined,
    levelIds: selectedLevels.length > 0 ? selectedLevels : undefined,
    badgeIds: selectedBadges.length > 0 ? selectedBadges : undefined,
  };
  
  const { data: pendingReviews, isLoading: pendingLoading } = usePendingEssayReviews(currentCompanyId);
  const { data: allReviews, isLoading: allLoading } = useCompanyEssayReviews(currentCompanyId);
  const reviewAnswer = useReviewEssayAnswer();

  // Filter functions
  const clearFilters = () => {
    setUserNameSearch('');
    setSelectedTags([]);
    setSelectedLevels([]);
    setSelectedBadges([]);
  };

  const hasActiveFilters = userNameSearch || selectedTags.length > 0 || selectedLevels.length > 0 || selectedBadges.length > 0;

  const handleReviewClick = (answer: any) => {
    setSelectedAnswer(answer);
    setReviewNotes('');
    setPointsEarned(answer.question_points || 0);
    setReviewDialogOpen(true);
  };

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!selectedAnswer) return;

    await reviewAnswer.mutateAsync({
      answerId: selectedAnswer.id,
      reviewStatus: status,
      reviewNotes: reviewNotes.trim() || undefined,
      pointsEarned: status === 'approved' ? pointsEarned : 0
    });

    setReviewDialogOpen(false);
    setSelectedAnswer(null);
    setReviewNotes('');
    setPointsEarned(0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Aprovada</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rejeitada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatPath = (answer: any) => {
    return `${answer.course_title} > ${answer.module_title} > ${answer.lesson_title} > ${answer.quiz_title}`;
  };

  const renderAnswerCard = (answer: any, showActions = true) => (
    <Card key={answer.id} className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">
                {answer.user_name}
              </CardTitle>
              {getStatusBadge(answer.review_status)}
            </div>
            <CardDescription className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {formatPath(answer)}
            </CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true, locale: ptBR })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Pergunta ({answer.question_points || 0} pontos)
          </Label>
          <p className="text-sm mt-1 p-3 bg-muted rounded-lg">
            {answer.question_text}
          </p>
        </div>
        
        <div>
          <Label className="text-sm font-medium">Resposta do Aluno</Label>
          <p className="text-sm mt-1 p-3 bg-background border rounded-lg whitespace-pre-wrap">
            {answer.text_answer}
          </p>
        </div>

        {answer.review_status !== 'pending' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Award className="w-4 h-4" />
                Avaliação
              </Label>
              {answer.points_earned !== null && (
                <Badge variant="outline">
                  {answer.points_earned}/{answer.question_points || 0} pontos
                </Badge>
              )}
            </div>
            {answer.review_notes && (
              <p className="text-sm p-3 bg-muted rounded-lg">
                {answer.review_notes}
              </p>
            )}
            {answer.reviewed_at && (
              <p className="text-xs text-muted-foreground">
                Avaliado {answer.reviewer_name ? `por ${answer.reviewer_name}` : ''} em {' '}
                {formatDistanceToNow(new Date(answer.reviewed_at), { addSuffix: true, locale: ptBR })}
              </p>
            )}
          </div>
        )}

        {showActions && answer.review_status === 'pending' && (
          <div className="flex justify-end">
            <Button onClick={() => handleReviewClick(answer)} size="sm">
              Avaliar Resposta
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Revisão de Questões Dissertativas</h1>
          <p className="text-muted-foreground">
            Gerencie e avalie as respostas dissertativas dos alunos
          </p>
        </div>

        <PendingReviewsNotification />

        {/* Filters Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome do usuário..."
                  value={userNameSearch}
                  onChange={(e) => setUserNameSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros {hasActiveFilters && `(${[selectedTags.length, selectedLevels.length, selectedBadges.length].filter(n => n > 0).length})`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="start">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filtros Avançados</h4>
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          <X className="h-4 w-4 mr-2" />
                          Limpar
                        </Button>
                      )}
                    </div>

                    {/* Tags Filter */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Tags</Label>
                      <div className="max-h-32 overflow-y-auto space-y-2">
                        {tags.map((tag) => (
                          <div key={tag.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`tag-${tag.id}`}
                              checked={selectedTags.includes(tag.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedTags([...selectedTags, tag.id]);
                                } else {
                                  setSelectedTags(selectedTags.filter(id => id !== tag.id));
                                }
                              }}
                            />
                            <Label
                              htmlFor={`tag-${tag.id}`}
                              className="text-sm font-normal cursor-pointer flex items-center gap-2"
                            >
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: tag.color }}
                              />
                              {tag.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Levels Filter */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Níveis</Label>
                      <div className="max-h-32 overflow-y-auto space-y-2">
                        {levels.map((level) => (
                          <div key={level.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`level-${level.id}`}
                              checked={selectedLevels.includes(level.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedLevels([...selectedLevels, level.id]);
                                } else {
                                  setSelectedLevels(selectedLevels.filter(id => id !== level.id));
                                }
                              }}
                            />
                            <Label
                              htmlFor={`level-${level.id}`}
                              className="text-sm font-normal cursor-pointer flex items-center gap-2"
                            >
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: level.level_color }}
                              />
                              {level.level_name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Badges Filter */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Selos</Label>
                      <div className="max-h-32 overflow-y-auto space-y-2">
                        {badges.map((badge) => (
                          <div key={badge.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`badge-${badge.id}`}
                              checked={selectedBadges.includes(badge.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedBadges([...selectedBadges, badge.id]);
                                } else {
                                  setSelectedBadges(selectedBadges.filter(id => id !== badge.id));
                                }
                              }}
                            />
                            <Label
                              htmlFor={`badge-${badge.id}`}
                              className="text-sm font-normal cursor-pointer flex items-center gap-2"
                            >
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: badge.background_color }}
                              />
                              {badge.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {userNameSearch && (
                <Badge variant="secondary" className="gap-1">
                  Nome: {userNameSearch}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setUserNameSearch('')}
                  />
                </Badge>
              )}
              {selectedTags.map(tagId => {
                const tag = tags.find(t => t.id === tagId);
                return tag ? (
                  <Badge key={tagId} variant="secondary" className="gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSelectedTags(selectedTags.filter(id => id !== tagId))}
                    />
                  </Badge>
                ) : null;
              })}
              {selectedLevels.map(levelId => {
                const level = levels.find(l => l.id === levelId);
                return level ? (
                  <Badge key={levelId} variant="secondary" className="gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: level.level_color }}
                    />
                    {level.level_name}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSelectedLevels(selectedLevels.filter(id => id !== levelId))}
                    />
                  </Badge>
                ) : null;
              })}
              {selectedBadges.map(badgeId => {
                const badge = badges.find(b => b.id === badgeId);
                return badge ? (
                  <Badge key={badgeId} variant="secondary" className="gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: badge.background_color }}
                    />
                    {badge.name}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSelectedBadges(selectedBadges.filter(id => id !== badgeId))}
                    />
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pendentes ({pendingReviews?.data?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="all">
              Todas as Avaliações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-1/3" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-full" />
                        <div className="h-4 bg-muted rounded w-3/4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (!pendingReviews || pendingReviews.data.length === 0) ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma resposta pendente</h3>
                  <p className="text-muted-foreground text-center">
                    Todas as questões dissertativas foram avaliadas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingReviews?.data.map((answer) => renderAnswerCard(answer))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {allLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-1/3" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-full" />
                        <div className="h-4 bg-muted rounded w-3/4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : allLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-1/3" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-full" />
                        <div className="h-4 bg-muted rounded w-3/4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : allReviews?.data.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma questão dissertativa encontrada</h3>
                  <p className="text-muted-foreground text-center">
                    Ainda não há questões dissertativas para revisar.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {allReviews?.data.map((answer) => renderAnswerCard(answer, false))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Avaliar Resposta Dissertativa</DialogTitle>
            </DialogHeader>

            {selectedAnswer && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Aluno</Label>
                  <p className="text-sm mt-1">
                    {selectedAnswer.user_name}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Pergunta</Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-lg">
                    {selectedAnswer.lesson_quiz_questions?.question_text}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Resposta do Aluno</Label>
                  <p className="text-sm mt-1 p-3 bg-background border rounded-lg whitespace-pre-wrap">
                    {selectedAnswer.text_answer}
                  </p>
                </div>

                <div>
                  <Label htmlFor="points">Pontos a Conceder (máximo: {selectedAnswer.lesson_quiz_questions?.points || 0})</Label>
                  <Input
                    id="points"
                    type="number"
                    min="0"
                    max={selectedAnswer.lesson_quiz_questions?.points || 0}
                    value={pointsEarned}
                    onChange={(e) => setPointsEarned(parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Comentários da Avaliação (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Deixe um comentário sobre a avaliação..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setReviewDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReview('rejected')}
                    disabled={reviewAnswer.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeitar
                  </Button>
                  <Button
                    onClick={() => handleReview('approved')}
                    disabled={reviewAnswer.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aprovar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};