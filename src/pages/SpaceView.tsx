import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, MoreHorizontal, ImagePlus, Palette, Settings as SettingsIcon, UserMinus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useSpace } from '@/hooks/useSpace';
import { useSpacePosts } from '@/hooks/useSpacePosts';
import { useSpaceMembers } from '@/hooks/useSpaceMembers';
import { useSpaceAccess } from '@/hooks/useSpaceAccess';
import { useIsSpaceMember } from '@/hooks/useIsSpaceMember';
import { useManageSpaceMembers } from '@/hooks/useManageSpaceMembers';
import { useEvents } from '@/hooks/useEvents';
import { PostCard } from '@/components/posts/PostCard';
import { CreatePostForm } from '@/components/posts/CreatePostForm';
import { EventsList } from '@/components/events/EventsList';
import { CreateEventDialog } from '@/components/events/CreateEventDialog';
import { getSpaceTypeInfo, renderSpaceIcon, getSpaceIcon } from '@/lib/spaceUtils';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SpaceCustomizationDrawer } from '@/components/space/SpaceCustomizationDrawer';
import { SpaceBanner } from '@/components/ui/space-banner';
import { useState, useEffect } from 'react';
import { PostListView } from '@/components/posts/PostListView';
import { PostCardView } from '@/components/posts/PostCardView';
import { PostGridContainer } from '@/components/posts/PostGridContainer';

export type PostLayout = 'feed' | 'list' | 'card';
export const SpaceView = () => {
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const [customizationTab, setCustomizationTab] = useState('general');
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const {
    spaceId
  } = useParams<{
    spaceId: string;
  }>();
  
  // Debug logs
  console.log('SpaceView - spaceId:', spaceId);
  const navigate = useNavigate();
  const {
    data: space,
    isLoading: spaceLoading,
    error: spaceError
  } = useSpace(spaceId!);
  const {
    data: posts,
    isLoading: postsLoading,
    error: postsError
  } = useSpacePosts(spaceId!);
  const {
    data: events,
    isLoading: eventsLoading,
    error: eventsError
  } = useEvents(spaceId!);
  const {
    data: members,
    isLoading: membersLoading,
    error: membersError
  } = useSpaceMembers(spaceId!);
  const {
    data: spaceAccess,
    isLoading: accessLoading,
    error: accessError
  } = useSpaceAccess(spaceId!);
  const {
    data: memberInfo,
    error: memberError
  } = useIsSpaceMember(spaceId!);
  
  // Debug logs
  console.log('SpaceView - space data:', space);
  console.log('SpaceView - spaceAccess:', spaceAccess);
  console.log('SpaceView - errors:', {
    spaceError,
    postsError,
    eventsError,
    membersError,
    accessError,
    memberError
  });
  const {
    leaveSpace
  } = useManageSpaceMembers();
  if (!spaceId) {
    navigate('/dashboard');
    return null;
  }
  if (spaceLoading || accessLoading) {
    return <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>;
  }
  if (spaceError || accessError) {
    console.error('SpaceView - Errors loading space:', { spaceError, accessError });
    return <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Erro ao carregar espaço</h2>
            <p className="text-muted-foreground mb-4">
              Ocorreu um erro ao carregar o espaço. Verifique sua conexão e tente novamente.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </DashboardLayout>;
  }

  if (!space || !spaceAccess?.canSee) {
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

  // If user can see space but can't access content (private/secret without membership)
  if (!spaceAccess?.canAccess) {
    return <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground mb-4">
              Este espaço é {spaceAccess?.visibility === 'private' ? 'privado' : 'secreto'} e você precisa ser membro para acessar seu conteúdo.
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
  const SpaceIcon = (spaceTypeInfo?.icon) || getSpaceIcon(space.type as any);
  const postLayout = (space.layout_type as PostLayout) || 'feed';
  return <DashboardLayout>
      <div className="min-h-screen bg-background">
        {/* Space Header */}
        <div className="bg-card border-b sticky top-0 z-10">
          <div className="w-full px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                
                
                
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center">
                    {renderSpaceIcon(space.type, space.custom_icon_type, space.custom_icon_value, "h-6 w-6")}
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold">{space.name}</h1>
                    <p className="text-sm text-muted-foreground">
                      {space.space_categories?.name}
                    </p>
                  </div>
                  {space.visibility === 'private' && <Badge variant="secondary">Privado</Badge>}
                  {space.visibility === 'secret' && <Badge variant="destructive">Secreto</Badge>}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => {
                      setCustomizationTab('banner');
                      setCustomizationOpen(true);
                    }}>
                      <ImagePlus className="h-4 w-4 mr-2" />
                      Adicionar capa
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setCustomizationTab('general');
                      setCustomizationOpen(true);
                    }}>
                      <Palette className="h-4 w-4 mr-2" />
                      Personalizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setCustomizationTab('members');
                      setCustomizationOpen(true);
                    }}>
                      <Users className="h-4 w-4 mr-2" />
                      Membros
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setCustomizationTab('general');
                      setCustomizationOpen(true);
                    }}>
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Opções
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    {memberInfo?.isMember && memberInfo.role !== 'admin' && <DropdownMenuItem onClick={() => {
                    if (confirm('Tem certeza que deseja sair deste espaço?')) {
                      leaveSpace.mutate(spaceId!, {
                        onSuccess: () => navigate('/dashboard')
                      });
                    }
                  }} className="text-destructive focus:text-destructive">
                        <UserMinus className="h-4 w-4 mr-2" />
                        Sair do espaço
                      </DropdownMenuItem>}
                    <DropdownMenuItem onClick={() => console.log('Excluir espaço')} className="text-destructive focus:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir espaço
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Space Banner - Full width, directly attached to header */}
        <div className="w-full">
          <SpaceBanner spaceId={spaceId} className="block" />
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

              {space.type === 'events' ? (
                // Events Space Content
                <>
                  {memberInfo?.isMember && (
                    <CreateEventDialog spaceId={spaceId} />
                  )}

                  {eventsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <EventsList
                      events={events || []}
                      onEventClick={(eventId) => {
                        // Handle event click
                      }}
                    />
                  )}
                </>
              ) : (
                <>
                  {/* Create Post */}
                  <CreatePostForm spaceId={spaceId} />

                  {/* Posts Feed */}
                  <div className={postLayout === 'list' ? 'space-y-2' : postLayout === 'card' ? '' : 'space-y-4'}>
                    {postsLoading ? (
                      <div className={postLayout === 'card' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                        {[...Array(postLayout === 'card' ? 6 : 3)].map((_, i) => (
                          <Card key={i}>
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
                          </Card>
                        ))}
                      </div>
                    ) : posts && posts.length > 0 ? (
                      postLayout === 'list' ? (
                        posts.map(post => <PostListView key={post.id} post={post} />)
                      ) : postLayout === 'card' ? (
                        <PostGridContainer>
                          {posts.map(post => <PostCardView key={post.id} post={post} />)}
                        </PostGridContainer>
                      ) : (
                        posts.map(post => <PostCard key={post.id} post={post} />)
                      )
                    ) : (
                      <Card>
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
                      </Card>
                    )}
                  </div>
                </>
              )}
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
                    const memberName = member.profiles?.first_name && member.profiles?.last_name 
                      ? `${member.profiles.first_name} ${member.profiles.last_name}` 
                      : 'Usuário';
                    const memberInitials = member.profiles?.first_name && member.profiles?.last_name 
                      ? `${member.profiles.first_name[0]}${member.profiles.last_name[0]}` 
                      : 'U';
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

      {/* Customization Drawer */}
      <SpaceCustomizationDrawer 
        open={customizationOpen} 
        onOpenChange={setCustomizationOpen} 
        initialTab={customizationTab}
        space={space} 
      />
    </DashboardLayout>;
};