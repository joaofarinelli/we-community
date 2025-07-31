import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import * as LucideIcons from 'lucide-react';

// Lista de ícones mais comuns para badges
const commonIcons = [
  'Award', 'Trophy', 'Star', 'Medal', 'Crown', 'Shield', 'Heart',
  'Target', 'Flag', 'CheckCircle', 'Badge', 'Gift', 'Zap', 'Flame',
  'Sun', 'Moon', 'Diamond', 'Gem', 'Sparkles', 'Plus', 'Check'
];

interface LucideIconSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const LucideIconSelector = ({ value, onValueChange }: LucideIconSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);

  const filteredIcons = commonIcons.filter(iconName =>
    iconName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const SelectedIcon = (LucideIcons as any)[value] || LucideIcons.Award;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <SelectedIcon className="h-4 w-4 mr-2" />
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <Input
            placeholder="Buscar ícone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
            {filteredIcons.map((iconName) => {
              const IconComponent = (LucideIcons as any)[iconName];
              return IconComponent ? (
                <Button
                  key={iconName}
                  variant={value === iconName ? "default" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    onValueChange(iconName);
                    setOpen(false);
                  }}
                >
                  <IconComponent className="h-4 w-4" />
                </Button>
              ) : null;
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};