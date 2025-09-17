import { Button } from '@/components/ui/button';

interface EventsFiltersProps {
  activeFilter: 'hoje' | 'futuros' | 'passados' | 'rascunhos' | 'buscar';
  onFilterChange: (filter: 'hoje' | 'futuros' | 'passados' | 'rascunhos' | 'buscar') => void;
  counts: {
    hoje: number;
    futuros: number;
    passados: number;
    rascunhos: number;
  };
  searchResultsCount?: number;
}

export const EventsFilters = ({ activeFilter, onFilterChange, counts, searchResultsCount }: EventsFiltersProps) => {
  const filters = [
    { key: 'hoje', label: 'Hoje', count: counts.hoje },
    { key: 'futuros', label: 'Futuros', count: counts.futuros },
    { key: 'passados', label: 'Passados', count: counts.passados },
    { key: 'rascunhos', label: 'Rascunhos', count: counts.rascunhos },
    { key: 'buscar', label: 'Buscar', count: searchResultsCount },
  ] as const;

  return (
    <div className="flex gap-2 mb-6">
      {filters.map((filter) => (
        <Button
          key={filter.key}
          variant={activeFilter === filter.key ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter.key)}
          className="gap-1"
        >
          {filter.label}
          <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-xs">
            {filter.count}
          </span>
        </Button>
      ))}
    </div>
  );
};