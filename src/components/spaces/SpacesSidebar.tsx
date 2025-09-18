import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Folder, 
  Search, 
  Users, 
  ChevronDown, 
  ChevronRight, 
  Star,
  Clock
} from 'lucide-react';
import { useSpaceCategories } from '@/hooks/useSpaceCategories';

interface SpacesSidebarProps {
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  activeTab: 'my-spaces' | 'explore';
  onTabChange: (tab: 'my-spaces' | 'explore') => void;
  spacesByCategory: Record<string, any[]>;
  mySpacesCount: number;
  exploreSpacesCount: number;
}

export const SpacesSidebar = ({
  selectedCategoryId,
  onCategoryChange,
  activeTab,
  onTabChange,
  spacesByCategory,
  mySpacesCount,
  exploreSpacesCount
}: SpacesSidebarProps) => {
  const { data: categories } = useSpaceCategories();
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredCategories = categories?.filter(category =>
    category.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
  ) || [];

  const totalSpaces = Object.values(spacesByCategory).reduce((acc, spaces) => acc + spaces.length, 0);

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-72'} transition-all duration-300 border-r bg-card/50`}>
      <div className="p-4 space-y-4">
        {/* Collapse Toggle */}
        <div className="flex items-center justify-between">
          {!isCollapsed && <h3 className="font-semibold">Navegação</h3>}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {!isCollapsed && (
          <>
            {/* Main Tabs */}
            <div className="space-y-2">
              <Button
                variant={activeTab === 'my-spaces' ? 'default' : 'ghost'}
                className="w-full justify-between"
                onClick={() => onTabChange('my-spaces')}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Meus Espaços</span>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {mySpacesCount}
                </Badge>
              </Button>

              <Button
                variant={activeTab === 'explore' ? 'default' : 'ghost'}
                className="w-full justify-between"
                onClick={() => onTabChange('explore')}
              >
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <span>Explorar</span>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {exploreSpacesCount}
                </Badge>
              </Button>
            </div>

            <Separator />

            {/* Quick Access */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Acesso Rápido</h4>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
              >
                <Star className="h-4 w-4 mr-2" />
                Favoritos
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
              >
                <Clock className="h-4 w-4 mr-2" />
                Recentes
              </Button>
            </div>

            <Separator />

            {/* Categories */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">Categorias</h4>
                <Badge variant="outline" className="text-xs">
                  {categories?.length || 0}
                </Badge>
              </div>

              {/* Category Search */}
              {categories && categories.length > 5 && (
                <Input
                  placeholder="Buscar categorias..."
                  value={categorySearchTerm}
                  onChange={(e) => setCategorySearchTerm(e.target.value)}
                  className="h-8"
                />
              )}

              <ScrollArea className="h-[300px]">
                <div className="space-y-1">
                  {/* All Categories */}
                  <Button
                    variant={selectedCategoryId === 'all' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => onCategoryChange('all')}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      <span>Todas</span>
                    </div>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {totalSpaces}
                    </Badge>
                  </Button>

                  {/* Category List */}
                  {filteredCategories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategoryId === category.id ? 'secondary' : 'ghost'}
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => onCategoryChange(category.id)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Folder className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{category.name}</span>
                      </div>
                      <Badge variant="outline" className="ml-2 text-xs flex-shrink-0">
                        {spacesByCategory[category.id]?.length || 0}
                      </Badge>
                    </Button>
                  ))}

                  {/* Uncategorized */}
                  {spacesByCategory['uncategorized'] && spacesByCategory['uncategorized'].length > 0 && (
                    <Button
                      variant={selectedCategoryId === 'uncategorized' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => onCategoryChange('uncategorized')}
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        <span>Sem Categoria</span>
                      </div>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {spacesByCategory['uncategorized'].length}
                      </Badge>
                    </Button>
                  )}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </div>
    </div>
  );
};