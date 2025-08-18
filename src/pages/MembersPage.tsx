import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { OtherUserProfileDialog } from '@/components/dashboard/OtherUserProfileDialog';
import { PageBanner } from '@/components/ui/page-banner';
import { useCompanyMembers } from '@/hooks/useCompanyMembers';
import { Search, Users, Grid, List, Filter, User, Calendar, X, SortAsc, SortDesc } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export const MembersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  
  // Filter states
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const { data: members, isLoading } = useCompanyMembers();

  const filteredMembers = members?.filter(member => {
    // Search filter
    const matchesSearch = member.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.profession?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Role filter
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    // Status filter  
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && member.is_active) ||
      (statusFilter === 'inactive' && !member.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  }).sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.display_name?.toLowerCase() || '';
        bValue = b.display_name?.toLowerCase() || '';
        break;
      case 'email':
        aValue = a.email?.toLowerCase() || '';
        bValue = b.email?.toLowerCase() || '';
        break;
      case 'role':
        aValue = a.role || 'member';
        bValue = b.role || 'member';
        break;
      case 'created_at':
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
      case 'profession':
        aValue = a.profession?.toLowerCase() || '';
        bValue = b.profession?.toLowerCase() || '';
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  }) || [];

  const clearFilters = () => {
    setRoleFilter('all');
    setStatusFilter('all');
    setSortBy('name');
    setSortOrder('asc');
    setSearchTerm('');
  };

  const hasActiveFilters = roleFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'name' || sortOrder !== 'asc' || searchTerm !== '';

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Proprietário';
      case 'admin': return 'Administrador'; 
      case 'moderator': return 'Moderador';
      default: return 'Membro';
    }
  };

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
            <AvatarImage 
              src={member.avatar_url} 
              alt={member.display_name}
              className="object-cover"
            />
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
    <Card
      className="overflow-hidden cursor-pointer"
      onClick={() => handleViewProfile(member.user_id)}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-20 w-20">
            <AvatarImage 
              src={member.avatar_url || ''} 
              alt={member.display_name}
              className="object-cover"
            />
            <AvatarFallback className="text-lg">
              {getUserInitials(member.display_name, member.email)}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">
              {member.display_name || 'Nome não disponível'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {member.profession || 'Profissão não informada'}
            </p>
            <Badge variant="outline" className="mt-2">
              {getRoleLabel(member.role || 'member')}
            </Badge>
          </div>

          <div className="text-xs text-muted-foreground">
            Membro desde {new Date(member.created_at).toLocaleDateString('pt-BR')}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4"
          onClick={(e) => {
            e.stopPropagation();
            handleViewProfile(member.user_id);
          }}
        >
          <User className="h-4 w-4 mr-2" />
          Ver perfil
        </Button>
      </CardContent>
    </Card>
  );

  const MemberListItem = ({ member }: { member: any }) => (
    <Card
      className="cursor-pointer"
      onClick={() => handleViewProfile(member.user_id)}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage 
              src={member.avatar_url} 
              alt={member.display_name}
              className="object-cover"
            />
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
                  {member.profession || 'Profissão não informada'}
                </p>
                <Badge variant="outline" className="mt-1">
                  {getRoleLabel(member.role || 'member')}
                </Badge>
              </div>
              
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(member.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewProfile(member.user_id);
            }}
          >
            <User className="h-4 w-4 mr-2" />
            Ver perfil
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      {/* Banner - sem padding para ocupar largura total */}
      <PageBanner bannerType="members" />
      
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
              placeholder="Buscar membros por nome, email, profissão..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                      !
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filtros</h4>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="h-4 w-4 mr-1" />
                        Limpar
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Cargo</label>
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os cargos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os cargos</SelectItem>
                          <SelectItem value="owner">Proprietário</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="moderator">Moderador</SelectItem>
                          <SelectItem value="member">Membro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os status</SelectItem>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Ordenar por</label>
                      <div className="flex gap-2">
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name">Nome</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="role">Cargo</SelectItem>
                            <SelectItem value="profession">Profissão</SelectItem>
                            <SelectItem value="created_at">Data de entrada</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        >
                          {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
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