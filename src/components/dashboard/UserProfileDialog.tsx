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
import { 
  User, 
  Mail, 
  MapPin, 
  Calendar, 
  Edit3, 
  Instagram, 
  MessageSquare, 
  FileText, 
  Users,
  Clock,
  X
} from 'lucide-react';

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserProfileDialog = ({ open, onOpenChange }: UserProfileDialogProps) => {
  const { user } = useAuth();
  const { data: company } = useCompany();
  const { data: userPoints } = useUserPoints();
  const { data: userLevel } = useUserLevel();

  const getUserInitials = () => {
    const firstName = user?.user_metadata?.first_name;
    const lastName = user?.user_metadata?.last_name;
    
    if (firstName && lastName) {
      return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
    } else if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    } else if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    
    return 'U';
  };

  const getDisplayName = () => {
    const firstName = user?.user_metadata?.first_name;
    const lastName = user?.user_metadata?.last_name;
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (user?.email) {
      return user.email.split('@')[0];
    }
    
    return 'Usuário';
  };

  const getMemberSince = () => {
    if (user?.created_at) {
      return new Date(user.created_at).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    return 'Data não disponível';
  };

  const getLastSeen = () => {
    // Para este exemplo, vamos simular "visto recentemente"
    return 'há 2 horas';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between p-6 border-b">
          <DialogTitle className="text-2xl font-bold">Perfil</DialogTitle>
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
                <AvatarImage src={user?.user_metadata?.avatar_url} alt={getDisplayName()} />
                <AvatarFallback className="text-3xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{getDisplayName()}</h2>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  Visto pela última vez {getLastSeen()}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  Membro desde {getMemberSince()}
                </div>
              </div>

              <Button className="w-full" variant="outline">
                <Edit3 className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>

          {/* Right Panel - Detailed Info */}
          <div className="lg:w-2/3 p-6">
            <Tabs defaultValue="sobre" className="h-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="sobre">Sobre</TabsTrigger>
                <TabsTrigger value="publicacoes">
                  Publicações {/* You can add count here if available */}
                </TabsTrigger>
                <TabsTrigger value="comentarios">
                  Comentários {/* You can add count here if available */}
                </TabsTrigger>
                <TabsTrigger value="espacos">
                  Espaços {/* You can add count here if available */}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sobre" className="mt-6 space-y-6">
                {/* Biography */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Biografia</h3>
                  <p className="text-muted-foreground">
                    {user?.user_metadata?.bio || 'Nenhuma biografia adicionada ainda.'}
                  </p>
                </div>

                {/* Contact Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Informações de Contato</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span>{user?.email}</span>
                    </div>
                    {user?.user_metadata?.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-3 text-muted-foreground" />
                        <span>{user.user_metadata.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Social */}
                {user?.user_metadata?.social && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Social</h3>
                    <div className="space-y-2">
                      {user.user_metadata.social.instagram && (
                        <div className="flex items-center">
                          <Instagram className="h-4 w-4 mr-3 text-muted-foreground" />
                          <span>{user.user_metadata.social.instagram}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Gamification Stats */}
                {userPoints && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Estatísticas</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-primary">
                            {userPoints.total_coins || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Moedas</div>
                        </CardContent>
                      </Card>
                      {userLevel && (
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-primary">
                              {userLevel.user_levels?.level_name}
                            </div>
                            <div className="text-sm text-muted-foreground">Nível Atual</div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="publicacoes" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>Suas publicações aparecerão aqui</p>
                </div>
              </TabsContent>

              <TabsContent value="comentarios" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                  <p>Seus comentários aparecerão aqui</p>
                </div>
              </TabsContent>

              <TabsContent value="espacos" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4" />
                  <p>Os espaços que você participa aparecerão aqui</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};