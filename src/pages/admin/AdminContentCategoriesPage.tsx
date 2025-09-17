import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { AdminCreateCategoryDialog } from '@/components/admin/AdminCreateCategoryDialog';
import { useCreateCategory } from '@/hooks/useCreateCategory';
import { EditCategoryDialog } from '@/components/dashboard/EditCategoryDialog';
import { useEditCategory } from '@/hooks/useEditCategory';
import { DeleteCategoryDialog } from '@/components/admin/DeleteCategoryDialog';
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
import { useAdminCategoriesRealtime } from '@/hooks/useRealtimeUpdates';
import { RealtimeStatus } from '@/components/admin/RealtimeStatus';

export const AdminContentCategoriesPage = () => {
  const { currentCompanyId } = useCompanyContext();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deletingCategory, setDeletingCategory] = useState<any>(null);
  
  // Enable real-time updates
  useAdminCategoriesRealtime();
  
  const { isOpen, setIsOpen, createCategory, isLoading: isCreating } = useCreateCategory();
  const { editCategory, isLoading: isEditing } = useEditCategory();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-space-categories', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return [];
      
      const { data, error } = await supabase
        .from('space_categories')
        .select('id, name, created_by, created_at, order_index')
        .eq('company_id', currentCompanyId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentCompanyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Separate query for creators data
  const { data: creatorsData } = useQuery({
    queryKey: ['admin-categories-creators', currentCompanyId, categories?.map(c => c.created_by)],
    queryFn: async () => {
      if (!categories?.length) return {};
      
      const creatorIds = [...new Set(categories.map(c => c.created_by))];
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', creatorIds);
      
      if (error) throw error;
      return data?.reduce((acc, creator) => {
        acc[creator.user_id] = creator;
        return acc;
      }, {} as Record<string, any>) || {};
    },
    enabled: !!categories?.length,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Separate query for spaces count
  const { data: spacesCount } = useQuery({
    queryKey: ['admin-categories-spaces-count', currentCompanyId, categories?.map(c => c.id)],
    queryFn: async () => {
      if (!categories?.length) return {};
      
      const categoryIds = categories.map(c => c.id);
      const { data, error } = await supabase
        .from('spaces')
        .select('category_id')
        .in('category_id', categoryIds);
      
      if (error) throw error;
      
      const counts = data?.reduce((acc, space) => {
        acc[space.category_id] = (acc[space.category_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      return counts;
    },
    enabled: !!categories?.length,
    staleTime: 1000 * 60 * 5, // 5 minutes
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
          <div className="flex items-center gap-3">
            <RealtimeStatus />
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova categoria
            </Button>
          </div>
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
          <TableSkeleton rows={6} columns={5} />
        ) : categories?.length === 0 ? (
          <div className="border rounded-lg p-16 text-center">
            <h2 className="text-xl font-semibold mb-2">Crie sua primeira categoria</h2>
            <p className="text-muted-foreground mb-6">
              Organize seus espaços criando categorias.
            </p>
            <Button onClick={() => setIsOpen(true)}>
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
                        {creatorsData?.[category.created_by] 
                          ? `${creatorsData[category.created_by].first_name} ${creatorsData[category.created_by].last_name}`
                          : 'Carregando...'
                        }
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">
                          {spacesCount?.[category.id] || 0} espaços
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
                          <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setDeletingCategory(category)}
                          >
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
      
      <AdminCreateCategoryDialog 
        isOpen={isOpen} 
        onOpenChange={setIsOpen}
      />
      
      {editingCategory && (
        <EditCategoryDialog
          category={editingCategory}
          open={!!editingCategory}
          onOpenChange={() => setEditingCategory(null)}
        />
      )}
      
      {deletingCategory && (
        <DeleteCategoryDialog
          category={deletingCategory}
          isOpen={!!deletingCategory}
          onOpenChange={() => setDeletingCategory(null)}
        />
      )}
    </AdminLayout>
  );
};