import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SpaceCard } from './SpaceCard';
import { 
  ChevronDown, 
  ChevronUp, 
  Folder, 
  Search, 
  Users,
  Eye,
  Users2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SpacesGridProps {
  spaces: any[];
  activeTab: 'my-spaces' | 'explore';
  viewMode: 'grid' | 'list';
  selectedCategoryId: string;
  spacesByCategory: Record<string, any[]>;
  categories: any[];
}

export const SpacesGrid = ({
  spaces,
  activeTab,
  viewMode,
  selectedCategoryId,
  spacesByCategory,
  categories
}: SpacesGridProps) => {
  const navigate = useNavigate();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId);
    } else {
      newCollapsed.add(sectionId);
    }
    setCollapsedSections(newCollapsed);
  };

  // For explore tab, separate member and non-member spaces
  const memberSpaces = activeTab === 'explore' 
    ? spaces.filter(space => (space as any).isMember)
    : [];
  const nonMemberSpaces = activeTab === 'explore' 
    ? spaces.filter(space => !(space as any).isMember && space.visibility === 'public')
    : [];

  const renderSpaceCard = (space: any) => (
    <SpaceCard 
      key={space.id}
      space={space}
      onClick={() => navigate(`/dashboard/space/${space.id}`)}
      showJoinLeave={activeTab === 'explore'}
      className={`${viewMode === 'grid' ? 'h-full min-h-[200px]' : 'w-full'} ${
        activeTab === 'explore' && (space as any).isMember ? 'opacity-60' : ''
      }`}
    />
  );

  const renderSpacesList = (spacesList: any[], title: string, icon: React.ReactNode, variant: 'default' | 'secondary' = 'default') => {
    if (spacesList.length === 0) return null;

    const sectionId = title.toLowerCase().replace(/\s+/g, '-');
    const isCollapsed = collapsedSections.has(sectionId);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-lg font-semibold">{title}</h2>
            <Badge variant={variant}>{spacesList.length}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection(sectionId)}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
        
        {!isCollapsed && (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4" 
            : "space-y-3"
          }>
            {spacesList.map(renderSpaceCard)}
          </div>
        )}
      </div>
    );
  };

  const renderCategorySection = (categoryId: string, categorySpaces: any[]) => {
    if (categorySpaces.length === 0) return null;
    
    const category = categories?.find(c => c.id === categoryId);
    const categoryName = category ? category.name : 'Sem Categoria';
    const sectionId = `category-${categoryId}`;
    const isCollapsed = collapsedSections.has(sectionId);

    return (
      <div key={categoryId} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{categoryName}</h2>
            <Badge variant="secondary">{categorySpaces.length}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection(sectionId)}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
        
        {!isCollapsed && (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4" 
            : "space-y-3"
          }>
            {categorySpaces.map(renderSpaceCard)}
          </div>
        )}
      </div>
    );
  };

  // Empty State
  if (spaces.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12 px-6">
          <div className="text-center space-y-4 max-w-md mx-auto">
            <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto">
              {activeTab === 'my-spaces' ? (
                <Folder className="h-10 w-10 text-muted-foreground" />
              ) : (
                <Search className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                {activeTab === 'my-spaces' 
                  ? (selectedCategoryId === 'all' 
                      ? 'Nenhum espaço encontrado' 
                      : 'Nenhum espaço nesta categoria'
                    )
                  : 'Nenhum espaço público disponível'
                }
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {activeTab === 'my-spaces'
                  ? (selectedCategoryId === 'all'
                      ? 'Você ainda não participa de nenhum espaço. Vá para "Explorar" para encontrar espaços públicos disponíveis.'
                      : 'Não há espaços nesta categoria ainda.'
                    )
                  : 'Não há espaços públicos para explorar no momento. Aguarde novos espaços serem criados ou convites para espaços privados.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render based on tab and category selection
  if (activeTab === 'explore') {
    return (
      <div className="space-y-8">
        {renderSpacesList(
          nonMemberSpaces, 
          "Espaços Disponíveis", 
          <Search className="h-5 w-5 text-primary" />,
          'default'
        )}
        {renderSpacesList(
          memberSpaces, 
          "Já Participo", 
          <Users className="h-5 w-5 text-muted-foreground" />,
          'secondary'
        )}
      </div>
    );
  }

  // My Spaces - show by category if "all" is selected
  if (selectedCategoryId === 'all') {
    return (
      <div className="space-y-8">
        {categories?.map(category => 
          renderCategorySection(category.id, spacesByCategory[category.id] || [])
        )}
        {spacesByCategory['uncategorized'] && 
          renderCategorySection('uncategorized', spacesByCategory['uncategorized'])
        }
      </div>
    );
  }

  // Single category view
  return (
    <div className={viewMode === 'grid' 
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4" 
      : "space-y-3"
    }>
      {spaces.map(renderSpaceCard)}
    </div>
  );
};