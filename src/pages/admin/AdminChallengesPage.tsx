import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CreateChallengeDialog } from '@/components/admin/CreateChallengeDialog';
import { EditChallengeDialog } from '@/components/admin/EditChallengeDialog';
import { useManageChallenges, useDeleteChallenge, useChallengeAnalytics } from '@/hooks/useManageChallenges';
import { ChallengePinButton } from '@/components/challenges/ChallengePinButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Users, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Edit,
  Coins,
  BookOpen,
  Download,
  Package,
  TrendingUp,
  Pin
} from 'lucide-react';

export const AdminChallengesPage = () => {
  const [editingChallenge, setEditingChallenge] = useState<any>(null);
  const { data: challenges, isLoading } = useManageChallenges();
  const { data: analytics } = useChallengeAnalytics();
  const deleteChallenge = useDeleteChallenge();

  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
      case 'course_completion': return <BookOpen className="h-4 w-4" />;
      case 'post_creation': return <Edit className="h-4 w-4" />;
      case 'marketplace_purchase': return <Package className="h-4 w-4" />;
      case 'points_accumulation': return <Coins className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case 'coins': return <Coins className="h-4 w-4" />;
      case 'course_access': return <BookOpen className="h-4 w-4" />;
      case 'file_download': return <Download className="h-4 w-4" />;
      case 'marketplace_item': return <Package className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  const formatChallengeType = (type: string) => {
    const types = {
      'course_completion': 'Completar Cursos',
      'post_creation': 'Criar Posts',
      'marketplace_purchase': 'Compras',
      'points_accumulation': 'Acumular Pontos',
      'custom_action': 'Ação Customizada'
    };
    return types[type as keyof typeof types] || type;
  };

  const formatRewardType = (type: string) => {
    const types = {
      'coins': 'WomanCoins',
      'course_access': 'Acesso a Curso',
      'file_download': 'Download de Arquivo',
      'marketplace_item': 'Item do Marketplace'
    };
    return types[type as keyof typeof types] || type;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Gerenciar Desafios</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </AdminLayout>
    );
  }

  // Calculate overall statistics
  const totalChallenges = challenges?.length || 0;
  const activeChallenges = challenges?.filter(c => c.is_active).length || 0;
  const totalParticipants = analytics?.reduce((sum, a) => sum + a.totalParticipants, 0) || 0;
  const avgCompletionRate = analytics?.length ? 
    analytics.reduce((sum, a) => sum + a.completionRate, 0) / analytics.length : 0;

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gerenciar Desafios</h1>
          <CreateChallengeDialog />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Desafios</p>
                <p className="text-2xl font-bold">{totalChallenges}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Desafios Ativos</p>
                <p className="text-2xl font-bold">{activeChallenges}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Participantes</p>
                <p className="text-2xl font-bold">{totalParticipants}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
                <p className="text-2xl font-bold">{avgCompletionRate.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Challenges List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {challenges?.map((challenge) => {
            const challengeAnalytics = analytics?.find(a => a.id === challenge.id);
            
            return (
              <Card key={challenge.id} className="w-[291px] h-[380px] overflow-hidden flex flex-col">
                {challenge.image_url && (
                  <div className="w-full h-40 overflow-hidden rounded-t-lg">
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
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={challenge.is_active ? "default" : "secondary"}>
                            {challenge.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                          <Badge variant="outline">
                            {formatChallengeType(challenge.challenge_type)}
                          </Badge>
                          {challenge.is_pinned && (
                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                              <Pin className="h-3 w-3" />
                              Fixado
                            </Badge>
                          )}
                          {!challenge.is_available_for_all_levels && (
                            <Badge variant="secondary" className="text-xs">
                              Nível específico
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <ChallengePinButton 
                        challengeId={challenge.id}
                        isPinned={challenge.is_pinned || false}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingChallenge(challenge)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteChallenge.mutate(challenge.id)}
                        disabled={deleteChallenge.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 flex-1 pr-2">
                        {challenge.description && (
                          <p className="text-sm text-muted-foreground">{challenge.description}</p>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium">
                              {challenge.challenge_type === 'proof_based' ? 'Tipo:' : 'Meta:'}
                            </p>
                            <p className="text-muted-foreground">
                              {challenge.challenge_type === 'proof_based' 
                                ? 'Baseado em Prova' 
                                : (challenge.requirements as any)?.target_value || 1}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">Recompensa:</p>
                            <div className="flex items-center space-x-1 text-muted-foreground">
                              {getRewardTypeIcon(challenge.reward_type)}
                              <span>{formatRewardType(challenge.reward_type)}</span>
                              {challenge.reward_type === 'coins' && (
                                <span>({(challenge.reward_value as any)?.amount})</span>
                              )}
                            </div>
                          </div>
                        </div>

                  {challengeAnalytics && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span>{challengeAnalytics.completedCount}/{challengeAnalytics.totalParticipants}</span>
                      </div>
                      <Progress 
                        value={challengeAnalytics.completionRate} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        {challengeAnalytics.completionRate.toFixed(1)}% de conclusão
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Criado em {new Date(challenge.created_at).toLocaleDateString()}</span>
                    </div>
                    {challenge.max_participants && (
                      <span>Máx: {challenge.max_participants} participantes</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {challenges?.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum desafio encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro desafio para engajar seus usuários.
              </p>
              <CreateChallengeDialog />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Challenge Dialog */}
      {editingChallenge && (
        <EditChallengeDialog
          challenge={editingChallenge}
          open={!!editingChallenge}
          onClose={() => setEditingChallenge(null)}
        />
      )}
    </AdminLayout>
  );
};