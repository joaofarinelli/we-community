import { useState } from 'react';
import { Search, X, Calendar, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SearchFilters {
  query: string;
  status?: 'active' | 'draft' | 'all';
  paymentType?: 'paid' | 'free' | 'all';
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

interface EventsSearchTabProps {
  searchFilters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  resultsCount: number;
}

export const EventsSearchTab = ({
  searchFilters,
  onFiltersChange,
  onClearFilters,
  hasActiveFilters,
  resultsCount,
}: EventsSearchTabProps) => {
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const handleQueryChange = (value: string) => {
    onFiltersChange({ query: value });
  };

  const handleDateRangeChange = (type: 'start' | 'end', date?: Date) => {
    const currentRange = searchFilters.dateRange || {};
    onFiltersChange({
      dateRange: {
        ...currentRange,
        [type]: date,
      }
    });
  };

  const clearDateRange = () => {
    onFiltersChange({ dateRange: undefined });
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar eventos por título, descrição ou localização..."
          value={searchFilters.query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="pl-9 pr-4"
        />
        {searchFilters.query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleQueryChange('')}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Status Filter */}
        <Select 
          value={searchFilters.status || 'all'} 
          onValueChange={(value) => onFiltersChange({ status: value as any })}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="draft">Rascunhos</SelectItem>
          </SelectContent>
        </Select>

        {/* Payment Type Filter */}
        <Select 
          value={searchFilters.paymentType || 'all'} 
          onValueChange={(value) => onFiltersChange({ paymentType: value as any })}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="free">Gratuitos</SelectItem>
            <SelectItem value="paid">Pagos</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range Filter */}
        <div className="flex gap-1 items-center">
          <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Calendar className="h-3 w-3" />
                {searchFilters.dateRange?.start ? 
                  format(searchFilters.dateRange.start, 'dd/MM', { locale: ptBR }) : 
                  'Início'
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={searchFilters.dateRange?.start}
                onSelect={(date) => {
                  handleDateRangeChange('start', date);
                  setStartDateOpen(false);
                }}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground">-</span>

          <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Calendar className="h-3 w-3" />
                {searchFilters.dateRange?.end ? 
                  format(searchFilters.dateRange.end, 'dd/MM', { locale: ptBR }) : 
                  'Fim'
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={searchFilters.dateRange?.end}
                onSelect={(date) => {
                  handleDateRangeChange('end', date);
                  setEndDateOpen(false);
                }}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          {(searchFilters.dateRange?.start || searchFilters.dateRange?.end) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDateRange}
              className="h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Clear All Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="gap-1"
          >
            <X className="h-3 w-3" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Results Count */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Filter className="h-3 w-3" />
            {resultsCount} evento{resultsCount !== 1 ? 's' : ''} encontrado{resultsCount !== 1 ? 's' : ''}
          </Badge>
        </div>
      )}
    </div>
  );
};