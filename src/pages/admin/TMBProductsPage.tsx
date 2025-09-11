import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Package, AlertCircle, CheckCircle } from 'lucide-react';
import { useTMBProducts } from '@/hooks/useTMBProducts';
import { useTMBProductSync } from '@/hooks/useTMBSync';
import { TMBProductCard } from '@/components/admin/tmb/TMBProductCard';
import { TMBProductsFilters } from '@/components/admin/tmb/TMBProductsFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const TMBProductsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filters = {
    search: searchTerm,
    category: selectedCategory || undefined,
    isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
  };

  const { data: products = [], isLoading, error, refetch } = useTMBProducts(filters);
  const syncMutation = useTMBProductSync();

  const handleSync = () => {
    syncMutation.mutate(undefined, {
      onSuccess: () => {
        refetch();
      }
    });
  };

  const handleToggleActive = async (productId: string, isActive: boolean) => {
    // TODO: Implementar toggle de ativação quando necessário
    toast.info('Funcionalidade de ativação/desativação será implementada em breve');
  };

  const handleViewDetails = (product: any) => {
    // TODO: Implementar modal de detalhes
    toast.info('Modal de detalhes será implementado em breve');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setStatusFilter('');
  };

  const activeProducts = products.filter(p => p.is_active);
  const inactiveProducts = products.filter(p => !p.is_active);
  const lastSync = products.length > 0 ? 
    Math.max(...products.map(p => new Date(p.last_synced_at || p.updated_at).getTime())) 
    : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Produtos TMB</h1>
            <p className="text-muted-foreground">
              Gerencie produtos sincronizados da TMB Educação
            </p>
          </div>
          
          <Button 
            onClick={handleSync} 
            disabled={syncMutation.isPending}
            className="shrink-0"
          >
            {syncMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sincronizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{products.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold text-green-600">{activeProducts.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Produtos Inativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-2xl font-bold text-orange-600">{inactiveProducts.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Última Sincronização</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {lastSync ? (
                  <span>{format(new Date(lastSync), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}</span>
                ) : (
                  <span className="text-muted-foreground">Nunca sincronizado</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
            <CardDescription>
              Filtre os produtos por categoria, status ou busque por nome
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TMBProductsFilters
              search={searchTerm}
              category={selectedCategory}
              status={statusFilter}
              onSearchChange={setSearchTerm}
              onCategoryChange={setSelectedCategory}
              onStatusChange={setStatusFilter}
              onClearFilters={clearFilters}
            />
          </CardContent>
        </Card>

        {/* Products Grid */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Produtos</CardTitle>
                <CardDescription>
                  {products.length} produto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              {(searchTerm || selectedCategory || statusFilter) && (
                <Badge variant="secondary">
                  Filtros aplicados
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-[200px] w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Erro ao carregar produtos</h3>
                <p className="text-muted-foreground mb-4">
                  Ocorreu um erro ao carregar os produtos TMB.
                </p>
                <Button onClick={() => refetch()}>
                  Tentar novamente
                </Button>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm || selectedCategory || statusFilter 
                    ? 'Nenhum produto encontrado' 
                    : 'Nenhum produto TMB sincronizado'
                  }
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedCategory || statusFilter 
                    ? 'Tente ajustar os filtros ou limpar a busca.'
                    : 'Clique em "Sincronizar" para buscar produtos da TMB Educação.'
                  }
                </p>
                {!(searchTerm || selectedCategory || statusFilter) && (
                  <Button onClick={handleSync} disabled={syncMutation.isPending}>
                    {syncMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sincronizar Produtos
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <TMBProductCard
                    key={product.id}
                    product={product}
                    onToggleActive={handleToggleActive}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};