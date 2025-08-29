import { LayoutGrid, List, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type PostLayout = 'feed' | 'list' | 'card';

interface PostLayoutSelectorProps {
  currentLayout: PostLayout;
  onLayoutChange: (layout: PostLayout) => void;
}

export const PostLayoutSelector = ({ currentLayout, onLayoutChange }: PostLayoutSelectorProps) => {
  const layouts = [
    { id: 'feed' as PostLayout, icon: FileText, label: 'Feed' },
    { id: 'list' as PostLayout, icon: List, label: 'Lista' },
    { id: 'card' as PostLayout, icon: LayoutGrid, label: 'Cartão' },
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 border rounded-md p-1 bg-background">
        {layouts.map((layout) => {
          const Icon = layout.icon;
          return (
            <Tooltip key={layout.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={currentLayout === layout.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onLayoutChange(layout.id)}
                  className="h-8 w-8 p-0"
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{layout.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};