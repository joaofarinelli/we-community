import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  SortAsc,
  Eye,
  Users2,
  Clock
} from 'lucide-react';

interface SpacesHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: 'name' | 'members' | 'activity' | 'recent';
  onSortChange: (sort: 'name' | 'members' | 'activity' | 'recent') => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  visibilityFilter: 'all' | 'public' | 'private';
  onVisibilityFilterChange: (filter: 'all' | 'public' | 'private') => void;
  totalSpaces: number;
  activeTab: 'my-spaces' | 'explore';
}

export const SpacesHeader = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  visibilityFilter,
  onVisibilityFilterChange,
  totalSpaces,
  activeTab
}: SpacesHeaderProps) => {
  const getSortLabel = (sort: string) => {
    switch (sort) {
      case 'name': return 'Nome';
      case 'members': return 'Membros';
      case 'activity': return 'Atividade';
      case 'recent': return 'Recentes';
      default: return 'Nome';
    }
  };

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'all': return 'Todos';
      case 'public': return 'Públicos';
      case 'private': return 'Privados';
      default: return 'Todos';
    }
  };

  return (
    <div className="space-y-4">
      {/* Title and Description */}
      <div>
        <h1 className="text-3xl font-bold mb-2">
          {activeTab === 'my-spaces' ? 'Meus Espaços' : 'Explorar Espaços'}
        </h1>
        <p className="text-muted-foreground">
          {activeTab === 'my-spaces' 
            ? 'Gerencie e acesse todos os seus espaços'
            : 'Descubra e participe de novos espaços'
          }
        </p>
        <Badge variant="outline" className="mt-2">
          {totalSpaces} {totalSpaces === 1 ? 'espaço' : 'espaços'}
        </Badge>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar espaços..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters and View Options */}
        <div className="flex items-center gap-2">
          {/* Visibility Filter */}
          <Select value={visibilityFilter} onValueChange={onVisibilityFilterChange}>
            <SelectTrigger className="w-32">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="public">Públicos</SelectItem>
              <SelectItem value="private">Privados</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default">
                <SortAsc className="h-4 w-4 mr-2" />
                {getSortLabel(sortBy)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onSortChange('name')}>
                <span className="mr-2">📝</span>
                Nome
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('members')}>
                <Users2 className="h-4 w-4 mr-2" />
                Membros
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('activity')}>
                <span className="mr-2">⚡</span>
                Atividade
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('recent')}>
                <Clock className="h-4 w-4 mr-2" />
                Recentes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle */}
          <div className="flex rounded-md border">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};