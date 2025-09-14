import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserOverview } from '@/hooks/useUserOverview';
import { useUserCourseProgressSummary } from '@/hooks/useUserCourseProgressSummary';
import { useIsFeatureEnabled } from '@/hooks/useCompanyFeatures';
import { TagIcon } from '@/components/admin/TagIcon';
import { UserChallengesPerformance } from '@/components/admin/UserChallengesPerformance';
import { UserTrailsPerformance } from '@/components/admin/UserTrailsPerformance';
import { UserTrailBadgesDisplay } from '@/components/admin/UserTrailBadgesDisplay';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Coins, 
  BookOpen, 
  MessageSquare,
  Award,
  CheckCircle
} from 'lucide-react';

export const AdminUserViewPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  
  const { data: userOverview, isLoading: overviewLoading } = useUserOverview(userId!);
  const { data: courseProgress, isLoading: progressLoading } = useUserCourseProgressSummary(userId!);
  
  // Check enabled features
  const challengesEnabled = useIsFeatureEnabled('challenges');
  const trailsEnabled = useIsFeatureEnabled('trails');

  if (!userId) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-destructive">Usuário não encontrado</h1>
          <Button onClick={() => navigate('/admin/users')} className="mt-4">
            Voltar para lista
          </Button>
        </div>
      </AdminLayout>
    );
  }

  if (overviewLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!userOverview) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-destructive">Usuário não encontrado</h1>
          <Button onClick={() => navigate('/admin/users')} className="mt-4">
            Voltar para lista
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const displayName = userOverview.profile.first_name && userOverview.profile.last_name 
    ? `${userOverview.profile.first_name} ${userOverview.profile.last_name}`.trim()
    : userOverview.profile.first_name || 'Nome não informado';

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/admin/users')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Perfil do Usuário</h1>
            <p className="text-muted-foreground">
              Visualização detalhada de {displayName}
            </p>
          </div>
        </div>

        {/* User Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="" className="object-cover" />
                  <AvatarFallback>
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{displayName}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {userOverview.profile.email}
                  </div>
                  {userOverview.profile.phone && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {userOverview.profile.phone}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Função:</span>
                  <Badge variant={
                    userOverview.profile.role === 'owner' ? 'destructive' : 
                    userOverview.profile.role === 'admin' ? 'default' : 
                    'secondary'
                  }>
                    {userOverview.profile.role === 'owner' ? 'Proprietário' : 
                     userOverview.profile.role === 'admin' ? 'Administrador' : 
                     'Membro'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Entrada:</span>
                  <span className="text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(userOverview.profile.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge 
                    variant="outline" 
                    className={userOverview.profile.is_active 
                      ? "text-green-600 border-green-600" 
                      : "text-red-600 border-red-600"
                    }
                  >
                    {userOverview.profile.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags Card */}
          <Card>
            <CardHeader>
              <CardTitle>Tags do Usuário</CardTitle>
            </CardHeader>
            <CardContent>
              {userOverview.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userOverview.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      style={{ backgroundColor: tag.color, color: (tag as any).text_color || '#FFFFFF' }}
                      className="inline-flex items-center gap-1"
                    >
                      <TagIcon tag={tag as any} size="sm" />
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Nenhuma tag atribuída</p>
              )}
            </CardContent>
          </Card>

          {/* Coins & Level Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Moedas & Nível
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total de Moedas:</span>
                  <span className="font-bold">{userOverview.points.total_coins}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Moedas Mensais:</span>
                  <span className="font-bold">{userOverview.points.monthly_coins}</span>
                </div>
              </div>
              
              {userOverview.level.name && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Nível Atual:</span>
                  <Badge
                    style={{ 
                      backgroundColor: userOverview.level.color || '#8B5CF6', 
                      color: '#fff' 
                    }}
                    className="flex items-center gap-1 w-fit"
                  >
                    {userOverview.level.icon && (
                      <span className="text-xs">{userOverview.level.icon}</span>
                    )}
                    {userOverview.level.name}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Posts Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold">{userOverview.posts_count}</div>
                <p className="text-sm text-muted-foreground">Posts publicados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Progress Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Progresso nos Cursos
            </CardTitle>
            <CardDescription>
              Acompanhe o progresso do usuário em cada curso
            </CardDescription>
          </CardHeader>
          <CardContent>
            {progressLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : courseProgress && courseProgress.length > 0 ? (
              <div className="space-y-6">
                {courseProgress.map((course) => (
                  <div key={course.course_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{course.course_title}</h4>
                      <div className="flex items-center gap-2">
                        {course.certificate_issued && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <Award className="h-3 w-3 mr-1" />
                            Certificado
                          </Badge>
                        )}
                        {course.is_completed && (
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Concluído
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progresso: {course.progress_percent}%</span>
                        <span>{course.completed_lessons}/{course.total_lessons} aulas</span>
                      </div>
                      <Progress value={course.progress_percent} className="h-2" />
                    </div>

                    {course.certificate_issued && course.certificate_code && (
                      <p className="text-xs text-muted-foreground">
                        Certificado: {course.certificate_code}
                        {course.certificate_issued_at && (
                          <span> • Emitido em {format(new Date(course.certificate_issued_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        )}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Este usuário ainda não tem acesso a nenhum curso
              </p>
            )}
          </CardContent>
        </Card>

        {/* Challenges Performance Section */}
        {challengesEnabled && (
          <UserChallengesPerformance userId={userId!} />
        )}

        {/* Trails Performance Section */}
        {trailsEnabled && (
          <UserTrailsPerformance userId={userId!} />
        )}

        {/* Trail Badges Section */}
        {trailsEnabled && (
          <UserTrailBadgesDisplay userId={userId!} />
        )}
      </div>
    </AdminLayout>
  );
};