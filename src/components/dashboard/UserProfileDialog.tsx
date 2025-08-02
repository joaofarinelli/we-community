import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useUserPoints } from '@/hooks/useUserPoints';
import { useUserLevel } from '@/hooks/useUserLevel';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserMarketplaceItems } from '@/hooks/useUserMarketplaceItems';
import { useUserPosts, useUserStats } from '@/hooks/useUserPosts';
import { UserPostItem } from './UserPostItem';
import { MarketplaceItemCard } from '@/components/marketplace/MarketplaceItemCard';
import { User, Mail, MapPin, Calendar, Edit3, Instagram, MessageSquare, FileText, Users, Clock, X, Phone, ShoppingBag } from 'lucide-react';
interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export const UserProfileDialog = ({
  open,
  onOpenChange
}: UserProfileDialogProps) => {
  const {
    user
  } = useAuth();
  const {
    data: company
  } = useCompany();
  const {
    data: userPoints
  } = useUserPoints();
  const {
    data: userLevel
  } = useUserLevel();
  const {
    data: userProfile,
    isLoading
  } = useUserProfile();
  const {
    data: userPosts = []
  } = useUserPosts(user?.id || '');
  const {
    data: userStats
  } = useUserStats(user?.id || '');
  const {
    data: userMarketplaceItems = []
  } = useUserMarketplaceItems();
  const getUserInitials = () => {
    const firstName = userProfile?.first_name;
    const lastName = userProfile?.last_name;
    if (firstName && lastName) {
      return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
    } else if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    } else if (userProfile?.email) {
      return userProfile.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };
  const getDisplayName = () => {
    const firstName = userProfile?.first_name;
    const lastName = userProfile?.last_name;
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (userProfile?.email) {
      return userProfile.email.split('@')[0];
    }
    return 'Usuário';
  };
  const getMemberSince = () => {
    if (userProfile?.created_at) {
      return new Date(userProfile.created_at).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    return 'Data não disponível';
  };
  const getLastSeen = () => {
    if (userProfile?.updated_at) {
      const updatedDate = new Date(userProfile.updated_at);
      const now = new Date();
      const diffMs = now.getTime() - updatedDate.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
      } else if (diffHours > 0) {
        return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
      } else {
        return 'online agora';
      }
    }
    return 'não disponível';
  };
  if (isLoading) {
    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="flex flex-row items-center justify-between p-6 border-b">
            <DialogTitle className="text-2xl font-bold">Perfil</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando perfil...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>;
  }
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw] p-0 overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between p-4 md:p-6 border-b">
          <DialogTitle className="text-xl md:text-2xl font-bold">Perfil</DialogTitle>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row h-full overflow-hidden">
          {/* Left Panel - Avatar and Basic Info */}
          <div className="lg:w-1/3 p-4 md:p-6 lg:border-r bg-muted/30">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-24 w-24 md:h-32 md:w-32">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt={getDisplayName()} />
                <AvatarFallback className="text-2xl md:text-3xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-bold">{getDisplayName()}</h2>
                <div className="flex items-center text-xs md:text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  Visto pela última vez {getLastSeen()}
                </div>
                <div className="flex items-center text-xs md:text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  Membro desde {getMemberSince()}
                </div>
                {userProfile?.role && <Badge variant="secondary" className="mt-2 text-xs">
                    {userProfile.role === 'owner' ? 'Proprietário' : userProfile.role === 'admin' ? 'Administrador' : userProfile.role === 'moderator' ? 'Moderador' : 'Membro'}
                  </Badge>}
              </div>

              <Button className="w-full" variant="outline" size="sm">
                <Edit3 className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>

          {/* Right Panel - Detailed Info */}
          <div className="lg:w-2/3 p-4 md:p-6 overflow-auto">
            <Tabs defaultValue="sobre" className="h-full">
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 text-xs md:text-sm">
                <TabsTrigger value="sobre" className="px-2">Sobre</TabsTrigger>
                <TabsTrigger value="publicacoes" className="px-2">
                  <span className="hidden md:inline">Publicações</span>
                  <span className="md:hidden">Posts</span>
                  <span className="ml-1">({userStats?.postsCount || 0})</span>
                </TabsTrigger>
                <TabsTrigger value="comentarios" className="px-2">
                  <span className="hidden md:inline">Comentários</span>
                  <span className="md:hidden">Coment.</span>
                  <span className="ml-1">({userStats?.commentsCount || 0})</span>
                </TabsTrigger>
                <TabsTrigger value="espacos" className="px-2 hidden md:block">
                  Espaços
                </TabsTrigger>
                <TabsTrigger value="marketplace" className="px-2 hidden md:block">
                  <span className="hidden lg:inline">Marketplace</span>
                  <span className="lg:hidden">Market</span>
                  <span className="ml-1">({userMarketplaceItems.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sobre" className="mt-4 md:mt-6 space-y-4 md:space-y-6 overflow-auto max-h-[50vh] md:max-h-none">
                {/* Biography */}
                <div>
                  <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3">Biografia</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {userProfile?.first_name && userProfile?.last_name ? `${userProfile.first_name} ${userProfile.last_name}` : 'Nenhuma biografia adicionada ainda.'}
                  </p>
                </div>

                {/* Contact Info */}
                <div>
                  <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3">Informações de Contato</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Mail className="h-3 w-3 md:h-4 md:w-4 mr-2 md:mr-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm md:text-base truncate">{userProfile?.email}</span>
                    </div>
                    {userProfile?.phone && <div className="flex items-center">
                        <Phone className="h-3 w-3 md:h-4 md:w-4 mr-2 md:mr-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm md:text-base">{userProfile.phone}</span>
                      </div>}
                  </div>
                </div>

                {/* Gamification Stats */}
                {userPoints && <div>
                    <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3">Estatísticas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <Card>
                        <CardContent className="p-3 md:p-4 text-center">
                          <div className="text-xl md:text-2xl font-bold text-primary">
                            {userPoints.total_coins || 0}
                          </div>
                          <div className="text-xs md:text-sm text-muted-foreground">Moedas</div>
                        </CardContent>
                      </Card>
                      {userLevel && <Card>
                          <CardContent className="p-3 md:p-4 text-center">
                            <div className="text-xl md:text-2xl font-bold text-primary">
                              {userLevel.user_levels?.level_name}
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground">Nível Atual</div>
                          </CardContent>
                        </Card>}
                    </div>
                  </div>}
              </TabsContent>

              <TabsContent value="publicacoes" className="mt-4 md:mt-6 overflow-auto max-h-[50vh] md:max-h-none">
                {userPosts.length > 0 ? <div className="space-y-3">
                    {userPosts.map(post => <UserPostItem key={post.id} post={post} onClick={() => {
                  // Navigate to post or space
                  window.location.href = `/dashboard/space/${post.space_id}`;
                }} />)}
                  </div> : <div className="text-center py-8 md:py-12 text-muted-foreground">
                    <FileText className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-3 md:mb-4" />
                    <p className="text-sm md:text-base">Você ainda não fez nenhuma publicação</p>
                  </div>}
              </TabsContent>

              <TabsContent value="comentarios" className="mt-4 md:mt-6 overflow-auto max-h-[50vh] md:max-h-none">
                <div className="text-center py-8 md:py-12 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-3 md:mb-4" />
                  <p className="text-sm md:text-base">Seus comentários aparecerão aqui</p>
                </div>
              </TabsContent>

              <TabsContent value="espacos" className="mt-4 md:mt-6 overflow-auto max-h-[50vh] md:max-h-none">
                <div className="text-center py-8 md:py-12 text-muted-foreground">
                  <Users className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-3 md:mb-4" />
                  <p className="text-sm md:text-base">Os espaços que você participa aparecerão aqui</p>
                </div>
              </TabsContent>

              <TabsContent value="marketplace" className="mt-4 md:mt-6 overflow-auto max-h-[50vh] md:max-h-none">
                {userMarketplaceItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                    {userMarketplaceItems.map((item) => (
                      <MarketplaceItemCard 
                        key={item.id} 
                        item={item} 
                        userCoins={userPoints?.total_coins || 0}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-12 text-muted-foreground">
                    <ShoppingBag className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-3 md:mb-4" />
                    <p className="text-sm md:text-base">Você ainda não tem itens à venda no marketplace</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};