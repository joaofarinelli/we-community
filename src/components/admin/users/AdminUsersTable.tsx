import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilteredUser } from '@/hooks/useCompanyUsersWithFilters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserX, 
  Eye,
  Grid,
  List,
  Phone,
  Mail,
  Calendar,
  Tag,
  Trophy,
  BookOpen,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminUsersTableProps {
  members: FilteredUser[];
  onEditMember: (member: FilteredUser) => void;
  onToggleUserStatus: (member: FilteredUser) => void;
  onDeleteMember: (memberId: string) => void;
}

export const AdminUsersTable = ({
  members,
  onEditMember,
  onToggleUserStatus,
  onDeleteMember
}: AdminUsersTableProps) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const handleViewMember = (member: FilteredUser) => {
    navigate(`/admin/users/${member.user_id}`);
  };

  // Componente para mostrar as tags do usuário
  const UserTagsList = ({ tagNames }: { tagNames: string[] }) => {
    if (tagNames.length === 0) {
      return <span className="text-muted-foreground text-sm">Sem tags</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {tagNames.slice(0, 2).map((tagName, index) => (
          <Badge
            key={index}
            variant="outline"
            className="text-xs"
          >
            {tagName}
          </Badge>
        ))}
        {tagNames.length > 2 && (
          <span className="text-xs text-muted-foreground">+{tagNames.length - 2}</span>
        )}
      </div>
    );
  };

  // Card View Component for Mobile/Tablet
  const UserCard = ({ member }: { member: FilteredUser }) => {
    const displayName = member.first_name && member.last_name 
      ? `${member.first_name} ${member.last_name}`.trim()
      : member.first_name || 'Nome não informado';

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src="" className="object-cover" />
              <AvatarFallback>
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-base truncate">{displayName}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{member.email}</span>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewMember(member)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditMember(member)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleUserStatus(member)}>
                      <UserX className="h-4 w-4 mr-2" />
                      Alterar Status
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover membro</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover "{displayName}" da comunidade? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteMember(member.user_id)}>
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Role and Phone */}
              <div className="flex items-center gap-4 text-sm">
                <Badge variant={
                  member.role === 'owner' ? 'destructive' : 
                  member.role === 'admin' ? 'default' : 
                  'secondary'
                }>
                  {member.role === 'owner' ? 'Proprietário' :
                   member.role === 'admin' ? 'Administrador' :
                   'Membro'}
                </Badge>
                
                {member.phone && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span className="text-xs">{member.phone}</span>
                  </div>
                )}
              </div>

              {/* Tags, Level, Badges */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  <UserTagsList tagNames={member.tag_names} />
                </div>
                
                {member.level_name && (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-3 w-3 text-muted-foreground" />
                    <Badge 
                      variant="outline" 
                      style={{ color: member.level_color || undefined }}
                      className="text-xs"
                    >
                      {member.level_name}
                    </Badge>
                  </div>
                )}

                {member.badge_names.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-3 w-3 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {member.badge_names.slice(0, 2).map((badgeName, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {badgeName}
                        </Badge>
                      ))}
                      {member.badge_names.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{member.badge_names.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Stats and Date */}
              <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>{member.posts_count} posts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    <span>{member.courses_count} cursos</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span className="text-xs">
                    {format(new Date(member.joined_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Usuários da Comunidade</CardTitle>
            <CardDescription>
              Lista de todos os usuários (membros e administradores) na sua comunidade
            </CardDescription>
          </div>
          
          {/* View Toggle - Only show on larger screens */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Cards View (Mobile + Optional Desktop) */}
        <div className={cn(
          viewMode === 'cards' ? 'block' : 'hidden md:hidden',
          'space-y-4'
        )}>
          {members.map((member) => (
            <UserCard key={member.user_id} member={member} />
          ))}
        </div>

        {/* Table View (Desktop Only) */}
        <div className={cn(
          viewMode === 'table' ? 'hidden md:block' : 'hidden',
          'overflow-x-auto'
        )}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="hidden xl:table-cell">Nível</TableHead>
                <TableHead className="hidden xl:table-cell">Selos</TableHead>
                <TableHead className="hidden lg:table-cell">Posts</TableHead>
                <TableHead className="hidden lg:table-cell">Cursos</TableHead>
                <TableHead>Data de entrada</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const displayName = member.first_name && member.last_name 
                  ? `${member.first_name} ${member.last_name}`.trim()
                  : member.first_name || 'Nome não informado';

                return (
                  <TableRow key={member.user_id}>
                    <TableCell className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" className="object-cover" />
                        <AvatarFallback>
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{displayName}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{member.email}</TableCell>
                    <TableCell>
                      <Badge variant={
                        member.role === 'owner' ? 'destructive' : 
                        member.role === 'admin' ? 'default' : 
                        'secondary'
                      }>
                        {member.role === 'owner' ? 'Proprietário' :
                         member.role === 'admin' ? 'Administrador' :
                         'Membro'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {member.phone ? (
                        <span className="text-sm">{member.phone}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Oculto</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <UserTagsList tagNames={member.tag_names} />
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {member.level_name ? (
                        <Badge 
                          variant="outline" 
                          style={{ color: member.level_color || undefined }}
                          className="text-xs"
                        >
                          {member.level_name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sem nível</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {member.badge_names.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {member.badge_names.slice(0, 2).map((badgeName, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {badgeName}
                            </Badge>
                          ))}
                          {member.badge_names.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{member.badge_names.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sem selos</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className="font-mono">
                        {member.posts_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className="font-mono">
                        {member.courses_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {format(new Date(member.joined_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewMember(member)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditMember(member)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onToggleUserStatus(member)}>
                            <UserX className="h-4 w-4 mr-2" />
                            Alterar Status
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remover
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover membro</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover "{displayName}" da comunidade? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteMember(member.user_id)}>
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};