import { useState } from 'react';
import { SpaceCard } from './SpaceCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronUp, 
  Users, 
  Search,
  Folder
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNavigate } from 'react-router-dom';

interface SpacesGridProps {
  spacesByCategory: Record<string, any[]>;
  categories: any[];
  activeTab: 'my-spaces' | 'explore';
  hasSearchTerm: boolean;
}

export const SpacesGrid = ({
  spacesByCategory,
  categories,
  activeTab,
  hasSearchTerm,
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

  const renderSpaceCard = (space: any) => {
    return (
      <SpaceCard
        key={space.id}
        space={space}
        onClick={() => navigate(`/dashboard/space/${space.id}`)}
        showJoinLeave={activeTab === 'explore'}
      />
    );
  };

  const renderCategorySection = (category: any, categorySpaces: any[]) => {
    if (!categorySpaces || categorySpaces.length === 0) return null;

    const isCollapsed = collapsedSections.has(category.id);
    const categoryName = category.id === 'uncategorized' ? 'Sem Categoria' : category.name;

    return (
      <div key={category.id} className="space-y-4">
        <Collapsible open={!isCollapsed} onOpenChange={() => toggleSection(category.id)}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between pb-4 h-auto rounded-lg hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Folder className="h-5 w-5" />
                <div className="text-left">
                  <h2 className="text-lg font-semibold">{categoryName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {categorySpaces.length} {categorySpaces.length === 1 ? 'espaço' : 'espaços'}
                  </p>
                </div>
              </div>
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {categorySpaces.map(renderSpaceCard)}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  const renderExploreView = () => {
    const availableSpaces = [];
    const memberSpaces = [];

    // Separate spaces by membership status across all categories
    Object.values(spacesByCategory).flat().forEach(space => {
      if ((space as any).isMember) {
        memberSpaces.push(space);
      } else if (space.visibility === 'public') {
        availableSpaces.push(space);
      }
    });

    return (
      <div className="space-y-6">
        {availableSpaces.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 rounded-lg bg-muted/20">
              <Search className="h-5 w-5" />
              <div>
                <h2 className="text-lg font-semibold">Espaços Disponíveis</h2>
                <p className="text-sm text-muted-foreground">
                  {availableSpaces.length} {availableSpaces.length === 1 ? 'espaço' : 'espaços'} para explorar
                </p>
              </div>
            </div>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {availableSpaces.map(renderSpaceCard)}
            </div>
          </div>
        )}

        {memberSpaces.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 rounded-lg bg-primary/10">
              <Users className="h-5 w-5" />
              <div>
                <h2 className="text-lg font-semibold">Já Participo</h2>
                <p className="text-sm text-muted-foreground">
                  {memberSpaces.length} {memberSpaces.length === 1 ? 'espaço' : 'espaços'} onde você é membro
                </p>
              </div>
            </div>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {memberSpaces.map(renderSpaceCard)}
            </div>
          </div>
        )}

        {availableSpaces.length === 0 && memberSpaces.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              {hasSearchTerm ? 'Nenhum espaço encontrado' : 'Nenhum espaço disponível'}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              {hasSearchTerm 
                ? 'Tente ajustar sua busca.'
                : 'Novos espaços aparecerão aqui quando estiverem disponíveis.'
              }
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderMySpacesView = () => {
    // Filter categories that have spaces
    const categoriesWithSpaces = categories.filter(category => 
      spacesByCategory[category.id] && spacesByCategory[category.id].length > 0
    );

    // Check if there are uncategorized spaces
    const hasUncategorized = spacesByCategory['uncategorized'] && spacesByCategory['uncategorized'].length > 0;

    if (categoriesWithSpaces.length === 0 && !hasUncategorized) {
      return (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            {hasSearchTerm ? 'Nenhum espaço encontrado' : 'Você ainda não participa de nenhum espaço'}
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            {hasSearchTerm 
              ? 'Tente ajustar sua busca.'
              : 'Explore a aba "Explorar" para encontrar espaços para participar.'
            }
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {categoriesWithSpaces.map(category => 
          renderCategorySection(category, spacesByCategory[category.id])
        )}
        {hasUncategorized && renderCategorySection(
          { id: 'uncategorized', name: 'Sem Categoria' },
          spacesByCategory['uncategorized']
        )}
      </div>
    );
  };

  return activeTab === 'explore' ? renderExploreView() : renderMySpacesView();
};