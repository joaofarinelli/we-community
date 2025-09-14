import { useState } from 'react';
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
  selectedRoles: string[];
  selectedTags: string[];
  selectedCourses: string[];
  selectedLevels: string[];
  selectedBadges: string[];
  dateRange: DateRange | undefined;
  onSelectedRolesChange: (roles: string[]) => void;
  onSelectedTagsChange: (tags: string[]) => void;
  onSelectedCoursesChange: (courses: string[]) => void;
  onSelectedLevelsChange: (levels: string[]) => void;
  onSelectedBadgesChange: (badges: string[]) => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
  tags: Array<{ id: string; name: string }>;
  courses: Array<{ id: string; title: string }>;
  levels: Array<{ id: string; level_name: string }>;
  badges: Array<{ id: string; name: string }>;
  onClearFilters: () => void;
}

export const AdminUsersFilters = ({
  filters,
  onFiltersChange,
  selectedRoles,
  selectedTags,
  selectedCourses,
  selectedLevels,
  selectedBadges,
  dateRange,
  onSelectedRolesChange,
  onSelectedTagsChange,
  onSelectedCoursesChange,
  onSelectedLevelsChange,
  onSelectedBadgesChange,
  onDateRangeChange,
  tags,
  courses,
  levels,
  badges,
  onClearFilters
}: AdminUsersFiltersProps) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

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
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
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
                  value={selectedRoles.length === 0 ? "all" : selectedRoles.join(',')}
                  onValueChange={(value) => {
                    if (value === "all") {
                      onSelectedRolesChange([]);
                    } else {
                      const roles = value ? value.split(',') : [];
                      onSelectedRolesChange(roles);
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
                  value={selectedTags.length === 0 ? "all" : selectedTags.join(',')}
                  onValueChange={(value) => {
                    if (value === "all") {
                      onSelectedTagsChange([]);
                    } else {
                      const tagIds = value ? value.split(',') : [];
                      onSelectedTagsChange(tagIds);
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
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                            {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
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
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={onDateRangeChange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Courses Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Acesso a cursos</label>
                <Select
                  value={selectedCourses.length === 0 ? "all" : selectedCourses.join(',')}
                  onValueChange={(value) => {
                    if (value === "all") {
                      onSelectedCoursesChange([]);
                    } else {
                      const courseIds = value ? value.split(',') : [];
                      onSelectedCoursesChange(courseIds);
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
                  value={selectedLevels.length === 0 ? "all" : selectedLevels.join(',')}
                  onValueChange={(value) => {
                    if (value === "all") {
                      onSelectedLevelsChange([]);
                    } else {
                      const levelIds = value ? value.split(',') : [];
                      onSelectedLevelsChange(levelIds);
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
                  value={selectedBadges.length === 0 ? "all" : selectedBadges.join(',')}
                  onValueChange={(value) => {
                    if (value === "all") {
                      onSelectedBadgesChange([]);
                    } else {
                      const badgeIds = value ? value.split(',') : [];
                      onSelectedBadgesChange(badgeIds);
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