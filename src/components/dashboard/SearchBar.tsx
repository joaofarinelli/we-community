import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { GlobalSearchDialog } from './GlobalSearchDialog';

export function SearchBar() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
        <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar..."
          className="pl-7 sm:pl-9 pr-3 sm:pr-4 bg-muted/50 border-border/50 rounded-lg h-8 sm:h-9 text-xs sm:text-sm focus:bg-background transition-colors cursor-pointer w-full"
          onClick={() => setDialogOpen(true)}
          readOnly
        />
      </div>
      <GlobalSearchDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}