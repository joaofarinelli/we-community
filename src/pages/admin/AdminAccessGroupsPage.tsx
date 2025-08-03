import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAccessGroups } from '@/hooks/useAccessGroups';
import { CreateAccessGroupDialog } from '@/components/admin/CreateAccessGroupDialog';
import { AccessGroupEditDialog } from '@/components/admin/AccessGroupEditDialog';
import { AccessGroup } from '@/hooks/useAccessGroups';

export const AdminAccessGroupsPage = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<AccessGroup | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');
  const { accessGroups, isLoading } = useAccessGroups();

  // Filter groups based on selected filter
  const filteredGroups = accessGroups.filter(group => {
    if (filter === 'active') return group.is_active;
    if (filter === 'archived') return !group.is_active;
    return true; // 'all'
  });

  // Count groups by status
  const activeCount = accessGroups.filter(group => group.is_active).length;
  const archivedCount = accessGroups.filter(group => !group.is_active).length;

  const handleEditGroup = (group: AccessGroup) => {
    setSelectedGroup(group);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Grupos de Acesso</h1>
            <p className="text-muted-foreground">
              Configure grupos de acesso para diferentes níveis de permissão
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Grupos de Acesso</h1>
            <p className="text-muted-foreground">
              Configure grupos de acesso para diferentes níveis de permissão
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            Novo grupo de acesso
          </Button>
        </div>

        {filteredGroups.length === 0 && filter !== 'all' ? (
          <Card>
            <CardHeader className="text-center py-12">
              <CardTitle className="text-xl text-foreground">
                Nenhum grupo {filter === 'active' ? 'ativo' : 'arquivado'}
              </CardTitle>
              <CardDescription className="max-w-md mx-auto">
                {filter === 'active' 
                  ? 'Não há grupos ativos no momento.'
                  : 'Não há grupos arquivados no momento.'
                }
              </CardDescription>
            </CardHeader>
          </Card>
        ) : filteredGroups.length === 0 ? (
          <Card>
            <CardHeader className="text-center py-12">
              <CardTitle className="text-xl text-foreground">Nenhum grupo criado ainda</CardTitle>
              <CardDescription className="max-w-md mx-auto">
                Crie grupos de acesso para organizar permissões e controlar o que diferentes tipos de usuários podem ver e fazer.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-12">
              <Button onClick={() => setShowCreateDialog(true)}>
                Criar grupo de acesso
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div>
            {/* Filter tabs */}
            <div className="flex gap-4 mb-6">
              <Button 
                variant={filter === 'all' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todos {accessGroups.length}
              </Button>
              <Button 
                variant={filter === 'active' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => setFilter('active')}
              >
                Ativos {activeCount}
              </Button>
              <Button 
                variant={filter === 'archived' ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => setFilter('archived')}
              >
                Arquivados {archivedCount}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground mb-4">
              {filteredGroups.length} grupo{filteredGroups.length !== 1 ? 's' : ''} de acesso
            </div>

            {/* Table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-muted-foreground">NOME</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">DESCRIÇÃO</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">STATUS</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">MEMBROS</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">ESPAÇOS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroups.map((group) => (
                      <tr 
                        key={group.id} 
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleEditGroup(group)}
                      >
                        <td className="p-4 font-medium text-foreground">{group.name}</td>
                        <td className="p-4 text-muted-foreground">
                          {group.description || '-'}
                        </td>
                        <td className="p-4">
                          <Badge 
                            variant="secondary" 
                            className={group.is_active 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-600"
                            }
                          >
                            {group.is_active ? 'Ativo' : 'Arquivado'}
                          </Badge>
                        </td>
                        <td className="p-4 text-foreground">{group.member_count || 0}</td>
                        <td className="p-4 text-foreground">{group.space_count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm">Anterior</Button>
                  <Button variant="outline" size="sm">Próximo</Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  Mostrando 1-{filteredGroups.length} de {filteredGroups.length}
                </span>
              </div>
            </Card>
          </div>
        )}

        <CreateAccessGroupDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />

        <AccessGroupEditDialog
          open={!!selectedGroup}
          onOpenChange={(open) => !open && setSelectedGroup(null)}
          accessGroup={selectedGroup}
        />
      </div>
    </AdminLayout>
  );
};