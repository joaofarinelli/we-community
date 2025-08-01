import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useChallenges, useChallengeRewards } from '@/hooks/useChallenges';
import { useChallengeProgressBatch, useChallengeParticipationsBatch } from '@/hooks/useChallengeProgress';
import { useFilteredChallengesByAccess } from '@/hooks/useChallengeAccess';
import { useUserLevel } from '@/hooks/useUserLevel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  
  const { data: challenges, isLoading } = useChallenges();
  const { data: userLevel } = useUserLevel();
  const { data: rewards } = useChallengeRewards();
  
  // Filter challenges by access tags first
  const accessibleChallenges = useFilteredChallengesByAccess(challenges || []);
  
  // Get challenge IDs for batch queries
  const challengeIds = useMemo(() => accessibleChallenges?.map(c => c.id) || [], [accessibleChallenges]);
  
  // Batch load progress and participations for better performance
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

  const handleViewChallenge = (challenge: any) => {
    setSelectedChallenge(challenge);
    setShowChallengeDetails(true);
  };

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeChallenges.map((challenge) => {
                  const userProgress = progressMap[challenge.id];
                  const progressValue = userProgress?.progress_value || 0;
                  const targetValue = userProgress?.target_value || (challenge.requirements as any)?.target_value || 1;
                  const progressPercent = Math.min((progressValue / targetValue) * 100, 100);

                  return (
                    <Card 
                      key={challenge.id} 
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleViewChallenge(challenge)}
                    >
                      {challenge.image_url && (
                        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                          <img 
                            src={challenge.image_url} 
                            alt={challenge.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              {getChallengeTypeIcon(challenge.challenge_type)}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{challenge.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">
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
                          <div className="flex items-center space-x-1">
                            {getRewardTypeIcon(challenge.reward_type)}
                            <span className="text-sm font-medium">
                              {challenge.reward_type === 'coins' 
                                ? `${(challenge.reward_value as any)?.amount} coins`
                                : formatRewardType(challenge.reward_type)
                              }
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {challenge.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{challenge.description}</p>
                        )}

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progresso</span>
                            <span>{progressValue}/{targetValue}</span>
                          </div>
                          <Progress value={progressPercent} className="h-3" />
                          <p className="text-xs text-muted-foreground">
                            {progressPercent.toFixed(1)}% concluído
                          </p>
                        </div>

                        {challenge.end_date && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Termina em {new Date(challenge.end_date).toLocaleDateString()}</span>
                          </div>
                        )}

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
                      </CardContent>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedChallenges.map((challenge) => {
                  const userProgress = progressMap[challenge.id];

                  return (
                    <Card 
                      key={challenge.id} 
                      className="border-green-200 bg-green-50/50 cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleViewChallenge(challenge)}
                    >
                      {challenge.image_url && (
                        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                          <img 
                            src={challenge.image_url} 
                            alt={challenge.title}
                            className="w-full h-full object-cover opacity-75"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{challenge.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="border-green-600 text-green-600">
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
                          <div className="flex items-center space-x-1">
                            {getRewardTypeIcon(challenge.reward_type)}
                            <span className="text-sm font-medium">
                              {challenge.reward_type === 'coins' 
                                ? `${(challenge.reward_value as any)?.amount} coins`
                                : formatRewardType(challenge.reward_type)
                              }
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {challenge.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{challenge.description}</p>
                        )}

                        <div className="space-y-2">
                          <Progress value={100} className="h-3" />
                          <p className="text-xs text-green-600 font-medium">
                            ✓ Desafio concluído!
                          </p>
                        </div>

                        {userProgress?.completed_at && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Concluído em {new Date(userProgress.completed_at).toLocaleDateString()}</span>
                          </div>
                        )}

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
                      </CardContent>
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