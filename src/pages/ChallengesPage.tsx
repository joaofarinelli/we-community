import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useChallenges, useChallengeRewards } from '@/hooks/useChallenges';
import { useChallengeProgressBatch, useChallengeParticipationsBatch } from '@/hooks/useChallengeProgress';
import { useUserLevel } from '@/hooks/useUserLevel';
import { useUserTags } from '@/hooks/useUserTags';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Target, 
  Gift,
  CheckCircle,
  Clock,
  Coins,
  BookOpen,
  Download,
  Package,
  Zap,
  Eye
} from 'lucide-react';
import { PageBanner } from '@/components/ui/page-banner';
import { ChallengeDetailsDialog } from '@/components/challenges/ChallengeDetailsDialog';

export const ChallengesPage = () => {
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [showChallengeDetails, setShowChallengeDetails] = useState(false);
  
  // Sempre chame todos os hooks primeiro, na mesma ordem
  const { user } = useAuth();
  const { data: challenges, isLoading } = useChallenges();
  const { data: userLevel } = useUserLevel();
  const { data: rewards } = useChallengeRewards();
  
  // Stabilize userId - sempre passe um valor consistente
  const stableUserId = user?.id || '';
  const { data: userTags } = useUserTags(stableUserId);
  
  // Filter challenges by access tags first using useMemo
  const accessibleChallenges = useMemo(() => {
    if (!challenges) return [];

    return challenges.filter(challenge => {
      // Se o desafio não tem tags de acesso específicas, é acessível a todos
      if (!challenge.access_tags || challenge.access_tags.length === 0) {
        return true;
      }

      // Se o usuário não tem tags, não pode acessar desafios com restrições
      if (!userTags || userTags.length === 0) {
        return false;
      }

      // Verifica se o usuário tem pelo menos uma das tags necessárias
      const userTagNames = userTags.map(tag => tag.tags.name);
      return challenge.access_tags.some((requiredTag: string) => 
        userTagNames.includes(requiredTag)
      );
    });
  }, [challenges, userTags]);
  
  // Get challenge IDs for batch queries - always return array to maintain stable dependency
  const challengeIds = useMemo(() => {
    return accessibleChallenges?.map(c => c.id) || [];
  }, [accessibleChallenges]);
  
  // Batch load progress and participations for better performance
  // Always call hooks with stable arrays, even if empty
  const { data: progressMap = {} } = useChallengeProgressBatch(challengeIds);
  const { data: participationsMap = {} } = useChallengeParticipationsBatch(challengeIds);

  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
      case 'course_completion': return <BookOpen className="h-5 w-5" />;
      case 'post_creation': return <Zap className="h-5 w-5" />;
      case 'marketplace_purchase': return <Package className="h-5 w-5" />;
      case 'points_accumulation': return <Coins className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case 'coins': return <Coins className="h-4 w-4" />;
      case 'course_access': return <BookOpen className="h-4 w-4" />;
      case 'file_download': return <Download className="h-4 w-4" />;
      case 'marketplace_item': return <Package className="h-4 w-4" />;
      default: return <Gift className="h-4 w-4" />;
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

  // Manter todas as separações de dados em useMemo estáveis
  // Filter challenges based on user level with stable memoization
  const filteredChallenges = useMemo(() => {
    if (!accessibleChallenges) return [];

    return accessibleChallenges.filter(challenge => {
      // If challenge is available for all levels, include it
      if (challenge.is_available_for_all_levels) {
        return true;
      }
      
      // If user doesn't have a level yet, only show all-levels challenges
      if (!userLevel?.user_levels) {
        return false;
      }

      // For now, include all challenges - we can add level filtering later if needed
      return true;
    });
  }, [accessibleChallenges, userLevel]);

  // Separate active and completed challenges with stable memoization
  const activeChallenges = useMemo(() => {
    return filteredChallenges.filter(challenge => {
      const userProgress = progressMap[challenge.id];
      return !userProgress?.is_completed;
    });
  }, [filteredChallenges, progressMap]);

  const completedChallenges = useMemo(() => {
    return filteredChallenges.filter(challenge => {
      const userProgress = progressMap[challenge.id];
      return userProgress?.is_completed;
    });
  }, [filteredChallenges, progressMap]);

  const handleViewChallenge = (challenge: any) => {
    setSelectedChallenge(challenge);
    setShowChallengeDetails(true);
  };

  // Move loading check after all hooks to maintain consistent hook order
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Desafios</h1>
              <p className="text-muted-foreground">
                Complete desafios e ganhe recompensas incríveis!
              </p>
            </div>
            <div className="flex flex-wrap gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse w-[291px] h-[345px]">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      {/* Banner - sem padding para ocupar largura total */}
      <PageBanner bannerType="challenges" />
      
      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Desafios</h1>
          <p className="text-muted-foreground">
            Complete desafios e ganhe recompensas incríveis!
          </p>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Ativos ({activeChallenges.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Concluídos ({completedChallenges.length})
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Recompensas ({rewards?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {activeChallenges.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum desafio ativo</h3>
                  <p className="text-muted-foreground">
                    Aguarde novos desafios serem criados!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-wrap gap-6">
                {activeChallenges.map((challenge) => {
                  const userProgress = progressMap[challenge.id];
                  const progressValue = userProgress?.progress_value || 0;
                  const targetValue = userProgress?.target_value || (challenge.requirements as any)?.target_value || 1;
                  const progressPercent = Math.min((progressValue / targetValue) * 100, 100);

                  return (
                    <Card 
                      key={challenge.id} 
                      className="w-[291px] h-[345px] flex flex-col cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleViewChallenge(challenge)}
                    >
                      <CardContent className="p-3 flex-1 overflow-hidden">
                        {challenge.image_url && (
                          <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                            <img 
                              src={challenge.image_url} 
                              alt={challenge.title}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="p-1.5 bg-primary/10 rounded-lg">
                                {getChallengeTypeIcon(challenge.challenge_type)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-sm leading-tight">{challenge.title}</h3>
                                <div className="flex items-center gap-1 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {formatChallengeType(challenge.challenge_type)}
                                  </Badge>
                                  {!challenge.is_available_for_all_levels && challenge.required_level_id && (
                                    <Badge variant="secondary" className="text-xs">
                                      Nível restrito
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 shrink-0">
                              {getRewardTypeIcon(challenge.reward_type)}
                              <span className="text-xs font-medium">
                                {challenge.reward_type === 'coins' 
                                  ? `${(challenge.reward_value as any)?.amount}`
                                  : formatRewardType(challenge.reward_type)
                                }
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Progress value={progressPercent} className="h-1.5" />
                            <div className="text-[11px] text-muted-foreground">{progressPercent.toFixed(1)}%</div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-3 pt-0">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewChallenge(challenge);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            {completedChallenges.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum desafio concluído</h3>
                  <p className="text-muted-foreground">
                    Complete alguns desafios para vê-los aqui!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-wrap gap-6">
                {completedChallenges.map((challenge) => {
                  const userProgress = progressMap[challenge.id];

                  return (
                    <Card 
                      key={challenge.id} 
                      className="w-[291px] h-[345px] flex flex-col cursor-pointer hover:shadow-md transition-shadow border-green-200 bg-green-50/50"
                      onClick={() => handleViewChallenge(challenge)}
                    >
                      <CardContent className="p-3 flex-1 overflow-hidden">
                        {challenge.image_url && (
                          <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                            <img
                              src={challenge.image_url}
                              alt={challenge.title}
                              className="w-full h-full object-cover rounded-lg opacity-75"
                            />
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="p-1.5 bg-green-100 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-sm leading-tight">{challenge.title}</h3>
                                <div className="flex items-center gap-1 mt-1">
                                  <Badge variant="outline" className="text-xs border-green-600 text-green-600">
                                    Concluído
                                  </Badge>
                                  {!challenge.is_available_for_all_levels && challenge.required_level_id && (
                                    <Badge variant="secondary" className="text-xs">
                                      Nível restrito
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 shrink-0">
                              {getRewardTypeIcon(challenge.reward_type)}
                              <span className="text-xs font-medium">
                                {challenge.reward_type === 'coins' 
                                  ? `${(challenge.reward_value as any)?.amount}`
                                  : formatRewardType(challenge.reward_type)
                                }
                              </span>
                            </div>
                          </div>

                          <div className="text-[11px] text-green-600 font-medium">✓ Desafio concluído</div>

                        </div>
                      </CardContent>
                      <CardFooter className="p-3 pt-0">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewChallenge(challenge);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            {!rewards || rewards.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma recompensa ainda</h3>
                  <p className="text-muted-foreground">
                    Complete desafios para ganhar recompensas!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {rewards.map((reward) => (
                  <Card key={reward.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            {getRewardTypeIcon(reward.reward_type)}
                          </div>
                          <div>
                            <h4 className="font-semibold">{reward.challenges.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Recompensa: {formatRewardType(reward.reward_type)}
                              {reward.reward_type === 'coins' && (reward.reward_details as any)?.amount && 
                                ` (${(reward.reward_details as any).amount} coins)`
                              }
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            Recebido em {new Date(reward.claimed_at).toLocaleDateString()}
                          </p>
                          {reward.reward_type === 'file_download' && (
                            <Button size="sm" className="mt-2">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Challenge Details Dialog */}
      {selectedChallenge && (
        <ChallengeDetailsDialog
          open={showChallengeDetails}
          onOpenChange={setShowChallengeDetails}
          challenge={selectedChallenge}
        />
      )}
    </DashboardLayout>
  );
};