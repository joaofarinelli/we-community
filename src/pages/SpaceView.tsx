import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSpace } from '@/hooks/useSpace';
import { useSpacePosts } from '@/hooks/useSpacePosts';
import { useSpaceMembers } from '@/hooks/useSpaceMembers';
import { PostCard } from '@/components/posts/PostCard';
import { CreatePostForm } from '@/components/posts/CreatePostForm';
import { getSpaceTypeInfo } from '@/lib/spaceUtils';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
export const SpaceView = () => {
  const {
    spaceId
  } = useParams<{
    spaceId: string;
  }>();
  const navigate = useNavigate();
  const {
    data: space,
    isLoading: spaceLoading
  } = useSpace(spaceId!);
  const {
    data: posts,
    isLoading: postsLoading
  } = useSpacePosts(spaceId!);
  const {
    data: members,
    isLoading: membersLoading
  } = useSpaceMembers(spaceId!);
  if (!spaceId) {
    navigate('/dashboard');
    return null;
  }
  if (spaceLoading) {
    return <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>;
  }
  if (!space) {
    return <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Espaço não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              O espaço que você está procurando não existe ou você não tem permissão para acessá-lo.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </DashboardLayout>;
  }
  const spaceTypeInfo = getSpaceTypeInfo(space.type as any);
  const SpaceIcon = spaceTypeInfo.icon;
  return <DashboardLayout>
      <div className="min-h-screen bg-background">
        {/* Space Header */}
        <div className="bg-background border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                
                
                
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <SpaceIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold">{space.name}</h1>
                    <p className="text-sm text-muted-foreground">
                      {space.space_categories?.name}
                    </p>
                  </div>
                  {space.is_private && <Badge variant="secondary">Privado</Badge>}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Description */}
              {space.description && <Card>
                  <CardContent className="p-6">
                    <p className="text-foreground">{space.description}</p>
                  </CardContent>
                </Card>}

              {/* Create Post */}
              <CreatePostForm spaceId={spaceId} />

              {/* Posts Feed */}
              <div className="space-y-4">
                {postsLoading ? <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Card key={i}>
                        <CardContent className="p-6">
                          <div className="animate-pulse space-y-3">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                              <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-32"></div>
                                <div className="h-3 bg-gray-200 rounded w-24"></div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded"></div>
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>)}
                  </div> : posts && posts.length > 0 ? posts.map(post => <PostCard key={post.id} post={post} />) : <Card>
                    <CardContent className="p-12 text-center">
                      <div className="space-y-3">
                        <div className="p-4 bg-muted rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                          <SpaceIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium">Nenhum post ainda</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Este espaço ainda não tem nenhuma publicação. Que tal ser o primeiro a compartilhar algo?
                        </p>
                      </div>
                    </CardContent>
                  </Card>}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Membros</span>
                    {!membersLoading && members && <Badge variant="secondary">{members.length}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {membersLoading ? <div className="p-6 space-y-3">
                      {[...Array(5)].map((_, i) => <div key={i} className="flex items-center space-x-3 animate-pulse">
                          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                          </div>
                        </div>)}
                    </div> : members && members.length > 0 ? <div className="p-6 space-y-3">
                      {members.map(member => {
                    const memberName = member.profiles ? `${member.profiles.first_name} ${member.profiles.last_name}` : 'Usuário';
                    const memberInitials = member.profiles ? `${member.profiles.first_name[0]}${member.profiles.last_name[0]}` : 'U';
                    return <div key={member.id} className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {memberInitials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{memberName}</p>
                              {member.role !== 'member' && <Badge variant="outline" className="text-xs">
                                  {member.role}
                                </Badge>}
                            </div>
                          </div>;
                  })}
                    </div> : <div className="p-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        Nenhum membro ainda
                      </p>
                    </div>}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>;
};