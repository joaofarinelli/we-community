import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter } from 'lucide-react';
import { useTMBProductCategories } from '@/hooks/useTMBProducts';

interface TMBProductsFiltersProps {
  search: string;
  category: string;
  status: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onClearFilters: () => void;
}

export const TMBProductsFilters = ({
  search,
  category,
  status,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onClearFilters
}: TMBProductsFiltersProps) => {
  const { data: categories = [], isLoading: loadingCategories } = useTMBProductCategories();

  const hasActiveFilters = search || category || status;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos TMB..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <Select value={category} onValueChange={(v) => onCategoryChange(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas as categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={status} onValueChange={(v) => onStatusChange(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="outline" onClick={onClearFilters} className="shrink-0">
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          
          {search && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => onSearchChange('')}>
              Busca: {search} <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          
          {category && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => onCategoryChange('')}>
              Categoria: {category} <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          
          {status && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => onStatusChange('')}>
              Status: {status === 'active' ? 'Ativos' : 'Inativos'} <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};