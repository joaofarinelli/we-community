import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Pin, TrendingUp } from 'lucide-react';
import { SortOption } from '@/hooks/useAllPosts';

interface FeedSortControlsProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const sortOptions = [
  {
    value: 'recent' as SortOption,
    label: 'Mais recentes',
    icon: Clock,
    description: 'Ordenar por data de criação'
  },
  {
    value: 'pinned' as SortOption,
    label: 'Posts fixados',
    icon: Pin,
    description: 'Posts fixados e anúncios primeiro'
  },
  {
    value: 'popular' as SortOption,
    label: 'Mais populares',
    icon: TrendingUp,
    description: 'Posts com mais interações'
  }
];

export const FeedSortControls = ({ sortBy, onSortChange }: FeedSortControlsProps) => {
  const currentOption = sortOptions.find(option => option.value === sortBy);
  const CurrentIcon = currentOption?.icon || Clock;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Ordenar por:</span>
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-auto border-none bg-transparent p-0 h-auto font-medium text-foreground hover:text-primary">
          <SelectValue>
            <div className="flex items-center gap-2">
              <CurrentIcon className="h-4 w-4" />
              <span>{currentOption?.label}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => {
            const Icon = option.icon;
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};