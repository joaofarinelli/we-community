import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function SearchBar() {
  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Buscar..."
        className="pl-9 pr-4 bg-muted/50 border-border/50 rounded-lg h-9 text-sm focus:bg-background transition-colors"
      />
    </div>
  );
}