import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MoreHorizontal, Edit, Trash2, Users, Shield, Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { useSpaceCategories } from '@/hooks/useSpaceCategories';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateSpaceDialog } from '@/components/admin/CreateSpaceDialog';
import { EditSpaceDialog } from '@/components/admin/EditSpaceDialog';
import { DeleteSpaceDialog } from '@/components/admin/DeleteSpaceDialog';
import { spaceTypes } from '@/lib/spaceUtils';

export const AdminContentSpacesPage = () => {
  const { currentCompanyId } = useCompanyContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<any>(null);
  const [deletingSpace, setDeletingSpace] = useState<any>(null);
  
  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Fetch space categories
  const { data: categories } = useSpaceCategories();

  const { data: spaces, isLoading } = useQuery({
    queryKey: ['admin-spaces', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return [];
      
      const { data, error } = await supabase
        .from('spaces')
        .select(`
          id, 
          name, 
          type, 
          visibility, 
          category_id, 
          created_by, 
          created_at, 
          order_index,
          space_categories(name)
        `)
        .eq('company_id', currentCompanyId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentCompanyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Separate query for members count
  const { data: membersCount } = useQuery({
    queryKey: ['admin-spaces-members-count', currentCompanyId, spaces?.map(s => s.id)],
    queryFn: async () => {
      if (!spaces?.length) return {};
      
      const spaceIds = spaces.map(s => s.id);
      const { data, error } = await supabase
        .from('space_members')
        .select('space_id, role')
        .in('space_id', spaceIds);
      
      if (error) throw error;
      
      const counts = data?.reduce((acc, member) => {
        if (!acc[member.space_id]) {
          acc[member.space_id] = { total: 0, moderators: 0 };
        }
        acc[member.space_id].total += 1;
        if (member.role === 'admin') {
          acc[member.space_id].moderators += 1;
        }
        return acc;
      }, {} as Record<string, { total: number; moderators: number }>) || {};
      
      return counts;
    },
    enabled: !!spaces?.length,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Filter spaces based on current filters
  const filteredSpaces = useMemo(() => {
    if (!spaces) return [];
    
    return spaces.filter(space => {
      const matchesName = nameFilter === '' || 
        space.name.toLowerCase().includes(nameFilter.toLowerCase());
      
      const matchesType = typeFilter === '' || space.type === typeFilter;
      
      const matchesVisibility = visibilityFilter === '' || space.visibility === visibilityFilter;
      
      const matchesCategory = categoryFilter === '' || space.category_id === categoryFilter;
      
      return matchesName && matchesType && matchesVisibility && matchesCategory;
    });
  }, [spaces, nameFilter, typeFilter, visibilityFilter, categoryFilter]);

  const clearAllFilters = () => {
    setNameFilter('');
    setTypeFilter('');
    setVisibilityFilter('');
    setCategoryFilter('');
  };

  const hasActiveFilters = nameFilter || typeFilter || visibilityFilter || categoryFilter;

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Badge variant="default">Público</Badge>;
      case 'private':
        return <Badge variant="secondary">Privado</Badge>;
      case 'secret':
        return <Badge variant="destructive">Secreto</Badge>;
      default:
        return <Badge variant="outline">{visibility}</Badge>;
    }
  };

  const getTypeDisplay = (type: string) => {
    const spaceType = spaceTypes.find(st => st.type === type);
    return spaceType?.name || type;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Espaços</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo espaço
          </Button>
        </div>

        <div className="space-y-4">
          <div className="bg-muted/25 p-4 rounded-lg">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Search className="h-4 w-4" />
              Filtros
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do espaço</label>
                <Input
                  placeholder="Filtrar por nome..."
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo do espaço</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    {spaceTypes.map((type) => (
                      <SelectItem key={type.type} value={type.type}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de acesso</label>
                <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os acessos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os acessos</SelectItem>
                    <SelectItem value="public">Público</SelectItem>
                    <SelectItem value="private">Privado</SelectItem>
                    <SelectItem value="secret">Secreto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as categorias</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {hasActiveFilters && (
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-8"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar filtros
                </Button>
                <span className="text-sm text-muted-foreground">
                  {filteredSpaces?.length || 0} de {spaces?.length || 0} espaços
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {hasActiveFilters ? (
            <span>
              Mostrando {filteredSpaces?.length || 0} de {spaces?.length || 0} espaços
            </span>
          ) : (
            <span>
              {spaces?.length || 0} espaço{(spaces?.length || 0) !== 1 ? 's' : ''} total
            </span>
          )}
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} columns={7} />
        ) : spaces?.length === 0 ? (
          <div className="border rounded-lg p-16 text-center">
            <h2 className="text-xl font-semibold mb-2">Crie seu primeiro espaço</h2>
            <p className="text-muted-foreground mb-6">
              Organize sua comunidade criando espaços.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Criar espaço
            </Button>
          </div>
        ) : filteredSpaces?.length === 0 ? (
          <div className="border rounded-lg p-16 text-center">
            <h2 className="text-xl font-semibold mb-2">Nenhum espaço encontrado</h2>
            <p className="text-muted-foreground mb-6">
              {hasActiveFilters 
                ? "Nenhum espaço corresponde aos filtros aplicados." 
                : "Não há espaços criados ainda."
              }
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearAllFilters}>
                Limpar filtros
              </Button>
            ) : (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                Criar espaço
              </Button>
            )}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium">NOME</th>
                  <th className="text-left p-4 font-medium">CATEGORIA</th>
                  <th className="text-left p-4 font-medium">TIPO</th>
                  <th className="text-left p-4 font-medium">MEMBROS</th>
                  <th className="text-left p-4 font-medium">MODERADORES</th>
                  <th className="text-left p-4 font-medium">ACESSO</th>
                  <th className="text-left p-4 font-medium">QUEM PODE PUBLICAR</th>
                  <th className="text-left p-4 font-medium">MEMBROS PODEM CONVIDAR</th>
                  <th className="text-left p-4 font-medium">OCULTAR CONTAGEM DE MEMBROS</th>
                  <th className="text-left p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filteredSpaces.map((space) => {
                  const memberData = membersCount?.[space.id] || { total: 0, moderators: 0 };
                  const totalMembers = memberData.total;
                  const moderators = memberData.moderators;
                  
                  return (
                    <tr key={space.id} className="border-b hover:bg-muted/25">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="font-medium">{space.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {(space as any).space_categories?.name || 'Sem categoria'}
                        </span>
                      </td>
                      <td className="p-4">{getTypeDisplay(space.type)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {totalMembers}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {moderators}
                        </div>
                      </td>
                      <td className="p-4">
                        {getVisibilityBadge(space.visibility)}
                      </td>
                      <td className="p-4">
                        <span className="text-sm">
                          Membros
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">
                          Não
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">
                          Não
                        </span>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingSpace(space)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeletingSpace(space)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="flex items-center justify-between p-4 border-t bg-muted/25">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Próximo
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Mostrando 1-{filteredSpaces?.length || 0} de {filteredSpaces?.length || 0}
                {hasActiveFilters && ` (${spaces?.length || 0} total)`}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <CreateSpaceDialog 
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
      
      {editingSpace && (
        <EditSpaceDialog
          space={editingSpace}
          isOpen={!!editingSpace}
          onOpenChange={() => setEditingSpace(null)}
        />
      )}
      
      {deletingSpace && (
        <DeleteSpaceDialog
          space={deletingSpace}
          isOpen={!!deletingSpace}
          onOpenChange={() => setDeletingSpace(null)}
        />
      )}
    </AdminLayout>
  );
};