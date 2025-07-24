import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOtherUserProfile, useOtherUserPoints, useOtherUserLevel } from '@/hooks/useOtherUserProfile';
import { useUserTags } from '@/hooks/useUserTags';
import { TagIcon } from '@/components/admin/TagIcon';
import { 
  User, 
  Mail, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Users,
  Clock,
  X,
  Phone
} from 'lucide-react';

interface OtherUserProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OtherUserProfileDialog = ({ userId, open, onOpenChange }: OtherUserProfileDialogProps) => {
  const { data: userProfile, isLoading } = useOtherUserProfile(userId || '');
  const { data: userPoints } = useOtherUserPoints(userId || '');
  const { data: userLevel } = useOtherUserLevel(userId || '');
  const { data: userTags = [] } = useUserTags(userId || '');

  const getUserInitials = () => {
    if (!userProfile) return 'U';
    
    const firstName = userProfile.first_name;
    const lastName = userProfile.last_name;
    
    if (firstName && lastName) {
      return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
    } else if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    
    return 'U';
  };

  const getDisplayName = () => {
    if (!userProfile) return 'Usuário';
    
    const firstName = userProfile.first_name;
    const lastName = userProfile.last_name;
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
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

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'owner':
        return 'Proprietário';
      case 'admin':
        return 'Administrador';
      case 'moderator':
        return 'Moderador';
      default:
        return 'Membro';
    }
  };

  if (!userId) return null;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="flex flex-row items-center justify-between p-6 border-b">
            <DialogTitle className="text-2xl font-bold">Perfil do Usuário</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
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
      </Dialog>
    );
  }

  if (!userProfile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="flex flex-row items-center justify-between p-6 border-b">
            <DialogTitle className="text-2xl font-bold">Perfil do Usuário</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Usuário não encontrado</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between p-6 border-b">
          <DialogTitle className="text-2xl font-bold">Perfil do Usuário</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row h-full">
          {/* Left Panel - Avatar and Basic Info */}
          <div className="lg:w-1/3 p-6 border-r bg-muted/30">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src="" alt={getDisplayName()} />
                <AvatarFallback className="text-3xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{getDisplayName()}</h2>
                
                {/* User Tags */}
                {userTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {userTags.slice(0, 3).map((userTag) => (
                      <Badge
                        key={userTag.id}
                        style={{ backgroundColor: userTag.tags.color, color: '#fff' }}
                        className="inline-flex items-center text-xs"
                      >
                        <TagIcon tag={userTag.tags as any} size="sm" />
                        {userTag.tags.name}
                      </Badge>
                    ))}
                    {userTags.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{userTags.length - 3}</span>
                    )}
                  </div>
                )}
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  Visto pela última vez {getLastSeen()}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  Membro desde {getMemberSince()}
                </div>
                
                <Badge 
                  variant={userProfile.is_active ? "default" : "destructive"} 
                  className="mt-2"
                >
                  {userProfile.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
                
                {userProfile.role && (
                  <Badge variant="secondary" className="mt-2">
                    {getRoleLabel(userProfile.role)}
                  </Badge>
                )}
              </div>

              <Button className="w-full" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Enviar Mensagem
              </Button>
            </div>
          </div>

          {/* Right Panel - Detailed Info */}
          <div className="lg:w-2/3 p-6">
            <Tabs defaultValue="sobre" className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sobre">Sobre</TabsTrigger>
                <TabsTrigger value="publicacoes">Publicações</TabsTrigger>
                <TabsTrigger value="atividade">Atividade</TabsTrigger>
              </TabsList>

              <TabsContent value="sobre" className="mt-6 space-y-6">
                {/* Contact Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Informações de Contato</h3>
                  <div className="space-y-2">
                    {userProfile.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                        <span>{userProfile.email}</span>
                      </div>
                    )}
                    {userProfile.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-3 text-muted-foreground" />
                        <span>{userProfile.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gamification Stats */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Estatísticas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-primary">
                          {userPoints?.total_coins || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Moedas</div>
                      </CardContent>
                    </Card>
                    {userLevel && (
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-primary">
                            {userLevel.user_levels?.level_name || 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground">Nível Atual</div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="publicacoes" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>As publicações deste usuário aparecerão aqui</p>
                </div>
              </TabsContent>

              <TabsContent value="atividade" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4" />
                  <p>A atividade recente deste usuário aparecerá aqui</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};