import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { icons } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketplaceCategory {
  id: string;
  name: string;
  icon_value: string;
  color: string;
}

interface CategoryFilterProps {
  categories: MarketplaceCategory[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  itemCounts?: Record<string, number>;
}

export const CategoryFilter = ({ 
  categories, 
  selectedCategory, 
  onCategoryChange,
  itemCounts = {}
}: CategoryFilterProps) => {
  const totalItems = Object.values(itemCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm">Categorias</h3>
      
      <div className="space-y-1">
        <Button
          variant={selectedCategory === null ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => onCategoryChange(null)}
        >
          <span className="flex-1 text-left">Todas</span>
          {totalItems > 0 && (
            <Badge variant="outline" className="ml-2">
              {totalItems}
            </Badge>
          )}
        </Button>
        
        {categories.map((category) => {
          const IconComponent = icons[category.icon_value as keyof typeof icons] || icons.Package;
          const itemCount = itemCounts[category.id] || 0;
          
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => onCategoryChange(category.id)}
            >
              <IconComponent 
                className="h-4 w-4 mr-2" 
                style={{ color: category.color }}
              />
              <span className="flex-1 text-left">{category.name}</span>
              {itemCount > 0 && (
                <Badge variant="outline" className="ml-2">
                  {itemCount}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};