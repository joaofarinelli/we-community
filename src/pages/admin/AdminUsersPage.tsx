import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { InviteUserDialog } from '@/components/admin/InviteUserDialog';
import { InvitesManagement } from '@/components/admin/InvitesManagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompanyMembers, CompanyMember } from '@/hooks/useCompanyMembers';
import { useUserTags } from '@/hooks/useUserTags';
import { useManageUserStatus } from '@/hooks/useManageUserStatus';
import { TagIcon } from '@/components/admin/TagIcon';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, Edit, Trash2, Users, Mail, UserCheck, UserX } from 'lucide-react';

export const AdminUsersPage = () => {
  const navigate = useNavigate();
  const { data: members, isLoading } = useCompanyMembers();
  const { toggleUserStatus } = useManageUserStatus();

  const handleEditMember = (member: CompanyMember) => {
    navigate(`/admin/users/${member.user_id}/edit`);
  };

  const handleToggleUserStatus = (member: CompanyMember) => {
    toggleUserStatus.mutate({ 
      userId: member.user_id, 
      isActive: !member.is_active 
    });
  };

  const handleDeleteMember = (memberId: string) => {
    // TODO: Implementar exclusão de membro
    console.log('Delete member:', memberId);
  };

  // Componente para mostrar as tags do usuário
  const UserTagsList = ({ userId }: { userId: string }) => {
    const { data: userTags = [] } = useUserTags(userId);
    
    if (userTags.length === 0) {
      return <span className="text-muted-foreground text-sm">Sem tags</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {userTags.slice(0, 2).map((userTag) => (
          <Badge
            key={userTag.id}
            style={{ backgroundColor: userTag.tags.color, color: '#fff' }}
            className="inline-flex items-center text-xs"
          >
            <TagIcon tag={userTag.tags as any} size="sm" />
            {userTag.tags.name}
          </Badge>
        ))}
        {userTags.length > 2 && (
          <span className="text-xs text-muted-foreground">+{userTags.length - 2}</span>
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
              Gerencie os membros da sua comunidade ({members?.length || 0} membros)
            </p>
          </div>
          <InviteUserDialog />
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

        {!members || members.length === 0 ? (
          <Card>
            <CardHeader className="text-center py-12">
              <CardTitle className="text-xl text-foreground">Nenhuma audiência ainda</CardTitle>
              <CardDescription className="max-w-md mx-auto">
                Você ainda não adicionou nenhuma pessoa. Comece a construir sua audiência convidando membros para sua comunidade ou importando contatos.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-12">
              <Button>
                Adicionar audiência
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Membros da Comunidade</CardTitle>
              <CardDescription>
                Lista de todos os membros ativos na sua comunidade
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
                    <TableHead>Data de entrada</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar_url || ''} />
                          <AvatarFallback>
                            {member.display_name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {member.display_name || 'Sem nome'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                          {member.role === 'admin' ? 'Administrador' : 'Membro'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <UserTagsList userId={member.user_id} />
                      </TableCell>
                      <TableCell>
                        {format(new Date(member.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={member.is_active 
                            ? "text-green-600 border-green-600" 
                            : "text-red-600 border-red-600"
                          }
                        >
                          {member.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditMember(member)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleUserStatus(member)}>
                              {member.is_active ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Inativar
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Ativar
                                </>
                              )}
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
                                    Tem certeza que deseja remover "{member.display_name || member.email}" da comunidade? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteMember(member.id)}>
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
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
      </div>
    </AdminLayout>
  );
};