import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { UserFilters } from '@/hooks/useCompanyUsersWithFilters';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';
import { 
  Search,
  Filter,
  CalendarIcon,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface AdminUsersFiltersProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  tags: Array<{ id: string; name: string }>;
  courses: Array<{ id: string; title: string }>;
  levels: Array<{ id: string; level_name: string }>;
  badges: Array<{ id: string; name: string }>;
  onClearFilters: () => void;
}

export const AdminUsersFilters = ({
  filters,
  onFiltersChange,
  tags,
  courses,
  levels,
  badges,
  onClearFilters
}: AdminUsersFiltersProps) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchInput || undefined });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync search input with filters when cleared
  useEffect(() => {
    if (!filters.search) {
      setSearchInput('');
    }
  }, [filters.search]);

  const handleFilterChange = useCallback((key: keyof UserFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Filtros de Audiência
        </CardTitle>
        <CardDescription>
          Use os filtros para encontrar usuários específicos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search - Always visible */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Buscar por nome/email</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nome ou email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Advanced Filters - Collapsible */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Filtros Avançados
              {isAdvancedOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Role Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Função</label>
                <Select
                  value={!filters.roles || filters.roles.length === 0 ? "all" : filters.roles.join(',')}
                  onValueChange={(value) => {
                    if (value === "all") {
                      handleFilterChange('roles', undefined);
                    } else {
                      const roles = value ? value.split(',') : [];
                      handleFilterChange('roles', roles.length > 0 ? roles : undefined);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as funções" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as funções</SelectItem>
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
                  value={!filters.tagIds || filters.tagIds.length === 0 ? "all" : filters.tagIds.join(',')}
                  onValueChange={(value) => {
                    if (value === "all") {
                      handleFilterChange('tagIds', undefined);
                    } else {
                      const tagIds = value ? value.split(',') : [];
                      handleFilterChange('tagIds', tagIds.length > 0 ? tagIds : undefined);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as tags</SelectItem>
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
                      {filters.joinedStart ? (
                        filters.joinedEnd ? (
                          <>
                            {format(new Date(filters.joinedStart), "dd/MM/yyyy", { locale: ptBR })} -{" "}
                            {format(new Date(filters.joinedEnd), "dd/MM/yyyy", { locale: ptBR })}
                          </>
                        ) : (
                          format(new Date(filters.joinedStart), "dd/MM/yyyy", { locale: ptBR })
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
                      defaultMonth={filters.joinedStart ? new Date(filters.joinedStart) : undefined}
                      selected={{
                        from: filters.joinedStart ? new Date(filters.joinedStart) : undefined,
                        to: filters.joinedEnd ? new Date(filters.joinedEnd) : undefined
                      }}
                      onSelect={(range: DateRange | undefined) => {
                        if (range?.from) {
                          handleFilterChange('joinedStart', format(range.from, 'yyyy-MM-dd'));
                          handleFilterChange('joinedEnd', range.to ? format(range.to, 'yyyy-MM-dd') : undefined);
                        } else {
                          handleFilterChange('joinedStart', undefined);
                          handleFilterChange('joinedEnd', undefined);
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Courses Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Acesso a cursos</label>
                <Select
                  value={!filters.courseIds || filters.courseIds.length === 0 ? "all" : filters.courseIds.join(',')}
                  onValueChange={(value) => {
                    if (value === "all") {
                      handleFilterChange('courseIds', undefined);
                    } else {
                      const courseIds = value ? value.split(',') : [];
                      handleFilterChange('courseIds', courseIds.length > 0 ? courseIds : undefined);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os cursos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os cursos</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Levels Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nível</label>
                <Select
                  value={!filters.levelIds || filters.levelIds.length === 0 ? "all" : filters.levelIds.join(',')}
                  onValueChange={(value) => {
                    if (value === "all") {
                      handleFilterChange('levelIds', undefined);
                    } else {
                      const levelIds = value ? value.split(',') : [];
                      handleFilterChange('levelIds', levelIds.length > 0 ? levelIds : undefined);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os níveis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os níveis</SelectItem>
                    {levels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.level_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Badges Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Selos</label>
                <Select
                  value={!filters.badgeIds || filters.badgeIds.length === 0 ? "all" : filters.badgeIds.join(',')}
                  onValueChange={(value) => {
                    if (value === "all") {
                      handleFilterChange('badgeIds', undefined);
                    } else {
                      const badgeIds = value ? value.split(',') : [];
                      handleFilterChange('badgeIds', badgeIds.length > 0 ? badgeIds : undefined);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os selos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os selos</SelectItem>
                    {badges.map((badge) => (
                      <SelectItem key={badge.id} value={badge.id}>
                        {badge.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={onClearFilters}
                className="w-full sm:w-auto"
              >
                <X className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};