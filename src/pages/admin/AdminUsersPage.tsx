import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { InviteUserDialog } from '@/components/admin/InviteUserDialog';
import { UserImportExportDialog } from '@/components/admin/UserImportExportDialog';
import { InvitesManagement } from '@/components/admin/InvitesManagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserEditDialog } from '@/components/admin/UserEditDialog';
import { useCompanyUsersWithFilters, UserFilters, FilteredUser } from '@/hooks/useCompanyUsersWithFilters';
import { useTags } from '@/hooks/useTags';
import { useCourses } from '@/hooks/useCourses';
import { useManageUserStatus } from '@/hooks/useManageUserStatus';
import { TagIcon } from '@/components/admin/TagIcon';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Users, 
  Mail, 
  UserCheck, 
  UserX, 
  FileSpreadsheet,
  Search,
  Filter,
  CalendarIcon,
  Eye,
  X
} from 'lucide-react';

export const AdminUsersPage = () => {
  const navigate = useNavigate();
  const [editingMember, setEditingMember] = useState<FilteredUser | null>(null);
  const [filters, setFilters] = useState<UserFilters>({});
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const { data: members, isLoading } = useCompanyUsersWithFilters(filters);
  const { data: tags = [] } = useTags();
  const { data: courses = [] } = useCourses();
  const { toggleUserStatus } = useManageUserStatus();

  // Update filters when individual filter states change
  useMemo(() => {
    const newFilters: UserFilters = {};
    
    if (filters.search) newFilters.search = filters.search;
    if (selectedRoles.length > 0) newFilters.roles = selectedRoles;
    if (selectedTags.length > 0) newFilters.tagIds = selectedTags;
    if (selectedCourses.length > 0) newFilters.courseIds = selectedCourses;
    if (dateRange?.from) newFilters.joinedStart = format(dateRange.from, 'yyyy-MM-dd');
    if (dateRange?.to) newFilters.joinedEnd = format(dateRange.to, 'yyyy-MM-dd');
    
    setFilters(newFilters);
  }, [filters.search, selectedRoles, selectedTags, selectedCourses, dateRange]);

  const handleEditMember = (member: FilteredUser) => {
    setEditingMember(member);
  };

  const handleToggleUserStatus = (member: FilteredUser) => {
    // Note: FilteredUser doesn't have is_active, so we'll assume active for now
    // This would need to be adjusted based on your actual data structure
    toggleUserStatus.mutate({ 
      userId: member.user_id, 
      isActive: false // You might need to fetch this separately or include in the RPC
    });
  };

  const handleDeleteMember = (memberId: string) => {
    // TODO: Implementar exclusão de membro
    console.log('Delete member:', memberId);
  };

  const handleViewMember = (member: FilteredUser) => {
    navigate(`/admin/users/${member.user_id}`);
  };

  const clearFilters = () => {
    setFilters({});
    setSelectedRoles([]);
    setSelectedTags([]);
    setSelectedCourses([]);
    setDateRange(undefined);
  };

  // Componente para mostrar as tags do usuário (agora usando dados do filtro)
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

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Audiência</h1>
            <p className="text-muted-foreground">
              Gerencie todos os usuários da sua comunidade - membros e administradores ({members?.length || 0} usuários)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <UserImportExportDialog>
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Importar/Exportar
              </Button>
            </UserImportExportDialog>
            <InviteUserDialog />
          </div>
        </div>

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Membros
            </TabsTrigger>
            <TabsTrigger value="invites" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Convites
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            
            {/* Filters Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros de Audiência
                </CardTitle>
                <CardDescription>
                  Use os filtros abaixo para encontrar usuários específicos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Search Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Buscar por nome/email</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Nome ou email..."
                        value={filters.search || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Role Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Função</label>
                    <Select
                      value={selectedRoles.join(',')}
                      onValueChange={(value) => {
                        const roles = value ? value.split(',') : [];
                        setSelectedRoles(roles);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as funções" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas as funções</SelectItem>
                        <SelectItem value="owner">Proprietário</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="member">Membro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tags Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tags</label>
                    <Select
                      value={selectedTags.join(',')}
                      onValueChange={(value) => {
                        const tagIds = value ? value.split(',') : [];
                        setSelectedTags(tagIds);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as tags" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas as tags</SelectItem>
                        {tags.map((tag) => (
                          <SelectItem key={tag.id} value={tag.id}>
                            {tag.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data de entrada</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                                {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                              </>
                            ) : (
                              format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                            )
                          ) : (
                            <span>Selecionar período</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Courses Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Acesso a cursos</label>
                    <Select
                      value={selectedCourses.join(',')}
                      onValueChange={(value) => {
                        const courseIds = value ? value.split(',') : [];
                        setSelectedCourses(courseIds);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os cursos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos os cursos</SelectItem>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear Filters Button */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">&nbsp;</label>
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="w-full"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

        {!members || members.length === 0 ? (
          <Card>
            <CardHeader className="text-center py-12">
              <CardTitle className="text-xl text-foreground">Nenhuma audiência ainda</CardTitle>
              <CardDescription className="max-w-md mx-auto">
                Você ainda não adicionou nenhuma pessoa. Comece a construir sua audiência convidando membros para sua comunidade ou importando contatos.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-12">
              <div className="flex items-center justify-center gap-2">
                <InviteUserDialog />
                <UserImportExportDialog>
                  <Button variant="outline">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Importar usuários
                  </Button>
                </UserImportExportDialog>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Usuários da Comunidade</CardTitle>
              <CardDescription>
                Lista de todos os usuários (membros e administradores) na sua comunidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membro</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Posts</TableHead>
                    <TableHead>Cursos</TableHead>
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
                        <TableCell>{member.email}</TableCell>
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
                        <TableCell>
                          <UserTagsList tagNames={member.tag_names} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {member.posts_count}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {member.courses_count}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(member.joined_at), 'dd/MM/yyyy', { locale: ptBR })}
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
                              <DropdownMenuItem onClick={() => handleEditMember(member)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleUserStatus(member)}>
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
                                    <AlertDialogAction onClick={() => handleDeleteMember(member.user_id)}>
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
            </CardContent>
          </Card>
        )}
          </TabsContent>

          <TabsContent value="invites">
            <InvitesManagement />
          </TabsContent>
        </Tabs>

        <UserEditDialog
          open={!!editingMember}
          onOpenChange={(open) => !open && setEditingMember(null)}
          member={editingMember as any}
        />
      </div>
    </AdminLayout>
  );
};