import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { OtherUserProfileDialog } from '@/components/dashboard/OtherUserProfileDialog';
import { useCompanyMembers } from '@/hooks/useCompanyMembers';
import { Search, Users, Grid, List, Filter, User, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export const MembersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const { data: members, isLoading } = useCompanyMembers();

  const filteredMembers = members?.filter(member =>
    member.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getUserInitials = (displayName?: string | null, email?: string) => {
    if (displayName) {
      const names = displayName.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0).toUpperCase()}${names[names.length - 1].charAt(0).toUpperCase()}`;
      }
      return displayName.substring(0, 2).toUpperCase();
    } else if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'admin': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'moderator': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Proprietário';
      case 'admin': return 'Administrador';
      case 'moderator': return 'Moderador';
      default: return 'Membro';
    }
  };

  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserProfile(true);
  };

  const MemberHoverCard = ({ member, children }: { member: any; children: React.ReactNode }) => (
    <HoverCard>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4" side="right" align="start" sideOffset={10}>
        <div className="flex items-start space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={member.avatar_url} alt={member.display_name} />
            <AvatarFallback className="text-lg">
              {getUserInitials(member.display_name, member.email)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div>
              <h4 className="text-lg font-semibold">
                {member.display_name || 'Nome não disponível'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {member.email}
              </p>
            </div>
            
            {member.role !== 'member' && (
              <Badge variant="secondary" className={getRoleColor(member.role)}>
                {getRoleLabel(member.role)}
              </Badge>
            )}
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              Membro desde {new Date(member.created_at).toLocaleDateString('pt-BR')}
            </div>
            
            <Button 
              size="sm" 
              className="w-full mt-3"
              onClick={() => handleViewProfile(member.user_id)}
            >
              <User className="h-4 w-4 mr-2" />
              Ver perfil
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );

  const MemberCard = ({ member }: { member: any }) => (
    <MemberHoverCard member={member}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={member.avatar_url} alt={member.display_name} />
              <AvatarFallback className="text-lg">
                {getUserInitials(member.display_name, member.email)}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">
                {member.display_name || 'Nome não disponível'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {member.email}
               </p>
               {member.role !== 'member' && (
                 <Badge variant="secondary" className={getRoleColor(member.role)}>
                   {getRoleLabel(member.role)}
                 </Badge>
               )}
             </div>

            <div className="text-xs text-muted-foreground">
              Membro desde {new Date(member.created_at).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </CardContent>
      </Card>
    </MemberHoverCard>
  );

  const MemberListItem = ({ member }: { member: any }) => (
    <MemberHoverCard member={member}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.avatar_url} alt={member.display_name} />
              <AvatarFallback>
                {getUserInitials(member.display_name, member.email)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium truncate">
                    {member.display_name || 'Nome não disponível'}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {member.email}
                  </p>
                </div>

                   <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(member.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </MemberHoverCard>
  );

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Membros ({members?.length || 0})
            </h1>
            <p className="text-muted-foreground">
              Conheça todos os membros da sua comunidade
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar membros por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>

        {/* Members Grid/List */}
        {isLoading ? (
          <div className={cn(
            "grid gap-6",
            viewMode === 'grid' 
              ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "grid-cols-1"
          )}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                {viewMode === 'grid' ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center space-y-4">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <div className="space-y-2 text-center">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-40" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-5 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        ) : filteredMembers.length > 0 ? (
          <div className={cn(
            "grid gap-6",
            viewMode === 'grid' 
              ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "grid-cols-1"
          )}>
            {filteredMembers.map((member) => (
              <div key={member.user_id}>
                {viewMode === 'grid' ? (
                  <MemberCard member={member} />
                ) : (
                  <MemberListItem member={member} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'Nenhum membro encontrado' : 'Nenhum membro disponível'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Tente ajustar os termos de busca'
                : 'Não há membros cadastrados no momento'
              }
            </p>
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                Limpar busca
              </Button>
            )}
          </div>
        )}
      </div>

      {/* User Profile Dialog */}
      <OtherUserProfileDialog
        userId={selectedUserId}
        open={showUserProfile}
        onOpenChange={setShowUserProfile}
      />
    </DashboardLayout>
  );
};