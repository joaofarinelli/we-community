import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
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

export const AdminContentCategoriesPage = () => {
  const { currentCompanyId } = useCompanyContext();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-space-categories', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return [];
      
      const { data, error } = await supabase
        .from('space_categories')
        .select(`
          *,
          creator:profiles!space_categories_created_by_fkey (first_name, last_name),
          spaces:spaces (id)
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
    { id: 'creator', label: 'Criador' },
    { id: 'date', label: 'Data de criação' },
    { id: 'spaces', label: 'Espaços' },
  ];

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova categoria
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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : categories?.length === 0 ? (
          <div className="border rounded-lg p-16 text-center">
            <h2 className="text-xl font-semibold mb-2">Crie sua primeira categoria</h2>
            <p className="text-muted-foreground mb-6">
              Organize seus espaços criando categorias.
            </p>
            <Button>
              Criar categoria
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium">Nome</th>
                  <th className="text-left p-4 font-medium">Criador</th>
                  <th className="text-left p-4 font-medium">Espaços</th>
                  <th className="text-left p-4 font-medium">Data de criação</th>
                  <th className="text-left p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {(categories || []).map((category) => (
                  <tr key={category.id} className="border-b hover:bg-muted/25">
                    <td className="p-4 font-medium">{category.name}</td>
                    <td className="p-4">
                      {Array.isArray(category.creator) && category.creator.length > 0 
                        ? `${category.creator[0].first_name} ${category.creator[0].last_name}`
                        : 'N/A'
                      }
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">
                        {Array.isArray(category.spaces) ? category.spaces.length : 0} espaços
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(new Date(category.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
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
                ))}
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
                Mostrando 1-{categories?.length || 0} de {categories?.length || 0}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};