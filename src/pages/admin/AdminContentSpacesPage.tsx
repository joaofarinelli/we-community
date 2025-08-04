import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, MoreHorizontal, Edit, Trash2, Users, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const AdminContentSpacesPage = () => {
  const { currentCompanyId } = useCompanyContext();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const { data: spaces, isLoading } = useQuery({
    queryKey: ['admin-spaces', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return [];
      
      const { data, error } = await supabase
        .from('spaces')
        .select(`
          *,
          category:space_categories!spaces_category_id_fkey (name),
          creator:profiles!spaces_created_by_fkey (first_name, last_name),
          members:space_members (id, role)
        `)
        .eq('company_id', currentCompanyId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentCompanyId,
  });

  const filters = [
    { id: 'name', label: 'Nome' },
    { id: 'type', label: 'Tipo' },
    { id: 'access', label: 'Acesso' },
    { id: 'group_access', label: 'Acesso a grupo de espaços' },
  ];

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

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
    switch (type) {
      case 'general':
        return 'Publicações';
      case 'events':
        return 'Eventos';
      case 'announcements':
        return 'Anúncios';
      default:
        return type;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Espaços</h1>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo espaço
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Button
              key={filter.id}
              variant={selectedFilters.includes(filter.id) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter(filter.id)}
              className="text-sm"
            >
              <Plus className="h-3 w-3 mr-1" />
              {filter.label}
            </Button>
          ))}
        </div>

        <div className="text-sm text-muted-foreground">
          {spaces?.length || 0} espaço{(spaces?.length || 0) !== 1 ? 's' : ''}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : spaces?.length === 0 ? (
          <div className="border rounded-lg p-16 text-center">
            <h2 className="text-xl font-semibold mb-2">Crie seu primeiro espaço</h2>
            <p className="text-muted-foreground mb-6">
              Organize sua comunidade criando espaços.
            </p>
            <Button>
              Criar espaço
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium">NOME</th>
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
                {spaces.map((space) => {
                  const totalMembers = Array.isArray(space.members) ? space.members.length : 0;
                  const moderators = Array.isArray(space.members) ? space.members.filter(m => m.role === 'admin').length : 0;
                  
                  return (
                    <tr key={space.id} className="border-b hover:bg-muted/25">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="font-medium">{space.name}</span>
                        </div>
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
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
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
                Mostrando 1-{spaces?.length || 0} de {spaces?.length || 0}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};