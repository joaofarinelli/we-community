import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { useAllPosts } from '@/hooks/useAllPosts';
import { useSpaces } from '@/hooks/useSpaces';
import { useCourses } from '@/hooks/useCourses';
import { useCompanyRanking } from '@/hooks/useCompanyRanking';
import { Users, MessageSquare, FolderOpen, BookOpen, TrendingUp, Activity } from 'lucide-react';

export const AdminAnalyticsPage = () => {
  const { data: users } = useCompanyUsers();
  const { data: posts } = useAllPosts('recent');
  const { data: spaces } = useSpaces();
  const { data: courses } = useCourses();
  const { data: ranking } = useCompanyRanking(5);

  // Calculate metrics
  const totalUsers = users?.length || 0;
  const totalPosts = posts?.length || 0;
  const totalSpaces = spaces?.length || 0;
  const totalCourses = courses?.length || 0;

  // Recent activity metrics
  const recentPosts = posts?.filter(post => {
    const postDate = new Date(post.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return postDate >= weekAgo;
  })?.length || 0;

  const stats = [
    {
      title: 'Usuários Totais',
      value: totalUsers,
      description: `${totalUsers} cadastrados`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Posts Publicados',
      value: totalPosts,
      description: `${recentPosts} esta semana`,
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Espaços Criados',
      value: totalSpaces,
      description: 'Total de espaços',
      icon: FolderOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Cursos Disponíveis',
      value: totalCourses,
      description: 'Cursos ativos',
      icon: BookOpen,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Acompanhe as métricas e o desempenho da sua plataforma
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rankings Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top 5 Ranking Mensal
              </CardTitle>
              <CardDescription>
                Usuários com mais moedas este mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ranking && ranking.length > 0 ? (
                <div className="space-y-3">
                  {ranking.map((user, index) => (
                    <div key={user.user_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <span className="font-medium">
                          {user.profiles?.first_name} {user.profiles?.last_name}
                        </span>
                      </div>
                      <span className="text-muted-foreground">
                        {user.monthly_coins} moedas
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum dado de ranking disponível
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Atividade Recente
              </CardTitle>
              <CardDescription>
                Resumo de atividades da última semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Posts publicados</span>
                  <Badge variant="secondary">{recentPosts}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Taxa de engajamento</span>
                  <Badge variant="outline">
                    {totalUsers > 0 ? Math.round((recentPosts / totalUsers) * 100) : 0}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Usuários cadastrados</span>
                  <Badge variant="secondary">{totalUsers}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Insights Rápidos</CardTitle>
            <CardDescription>
              Informações importantes sobre sua plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Engajamento</h4>
                <p className="text-sm text-muted-foreground">
                  {totalUsers > 0 && totalPosts > 0 
                    ? `Média de ${Math.round(totalPosts / totalUsers)} posts por usuário`
                    : 'Não há dados suficientes'
                  }
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Crescimento</h4>
                <p className="text-sm text-muted-foreground">
                  {recentPosts > 0 
                    ? `${recentPosts} novos posts esta semana`
                    : 'Nenhum post novo esta semana'
                  }
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Conteúdo</h4>
                <p className="text-sm text-muted-foreground">
                  {totalSpaces} espaços com {totalPosts} posts totais
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};