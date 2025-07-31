import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import * as LucideIcons from 'lucide-react';

// Lista expandida de ícones para badges e trilhas
const commonIcons = [
  // Conquistas e Prêmios
  'Award', 'Trophy', 'Medal', 'Crown', 'Shield', 'Badge', 'Gem', 'Diamond',
  'Star', 'Sparkles', 'Zap', 'Flame', 'Gift', 'Target', 'Flag',
  
  // Natureza e Jornada
  'Mountain', 'Compass', 'Map', 'MapPin', 'Navigation', 'Route', 'Signpost',
  'TreePine', 'Palmtree', 'Flower', 'Sun', 'Moon', 'Sunrise', 'Sunset',
  
  // Progresso e Movimento
  'TrendingUp', 'ArrowUp', 'ArrowRight', 'ChevronUp', 'Play', 'FastForward',
  'SkipForward', 'StepForward', 'CheckCircle', 'Check', 'CheckCheck',
  
  // Aprendizado e Conhecimento
  'BookOpen', 'GraduationCap', 'Brain', 'Lightbulb', 'Telescope', 'Microscope',
  'Library', 'ScrollText', 'FileText', 'PenTool', 'Edit3',
  
  // Tecnologia e Inovação
  'Rocket', 'Cpu', 'Smartphone', 'Monitor', 'Code', 'Binary', 'Wifi',
  'Globe', 'Satellite', 'Radio', 'Headphones',
  
  // Saúde e Bem-estar
  'Heart', 'Activity', 'Smile', 'Coffee', 'Apple', 'Dumbbell', 'Bike',
  'Clock', 'Timer', 'Alarm', 'Calendar',
  
  // Liderança e Comunidade
  'Users', 'UserCheck', 'HandHeart', 'Handshake', 'MessageCircle', 'Share2',
  'ThumbsUp', 'Eye', 'Focus', 'Crosshair',
  
  // Criatividade e Arte
  'Palette', 'Brush', 'Camera', 'Image', 'Music', 'Mic', 'Video',
  'Drama', 'Layers', 'Shapes', 'Circle',
  
  // Ferramentas e Utilidades
  'Settings', 'Tool', 'Wrench', 'Hammer', 'Key', 'Lock', 'Unlock',
  'Plus', 'Minus', 'X', 'Search', 'Filter'
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