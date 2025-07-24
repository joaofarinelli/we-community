import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { GlobalSearchDialog } from './GlobalSearchDialog';

export function SearchBar() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar..."
          className="pl-9 pr-4 bg-muted/50 border-border/50 rounded-lg h-9 text-sm focus:bg-background transition-colors cursor-pointer"
          onClick={() => setDialogOpen(true)}
          readOnly
        />
      </div>
      <GlobalSearchDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}