import { useNavigate, useLocation } from 'react-router-dom';
import { X, ExternalLink, Video, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSpaceCategories } from '@/hooks/useSpaceCategories';
import { useSpaces } from '@/hooks/useSpaces';
import { useCreateSpace } from '@/hooks/useCreateSpace';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { getSpaceIcon } from '@/lib/spaceUtils';
import { SpaceTypeSelectionDialog } from './SpaceTypeSelectionDialog';
import { SpaceConfigurationDialog } from './SpaceConfigurationDialog';
interface CircleSidebarProps {
  onClose?: () => void;
}
export function CircleSidebar({
  onClose
}: CircleSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    data: categories = []
  } = useSpaceCategories();
  const { toggleCategory, isCategoryExpanded, updateExpandedCategories, isLoading } = useUserPreferences();
  const {
    isTypeSelectionOpen,
    isConfigurationOpen,
    selectedType,
    selectedCategoryId,
    isCreating,
    openTypeSelection,
    selectTypeAndProceed,
    closeAllDialogs,
    createSpace
  } = useCreateSpace();

  return <aside className="w-[280px] h-screen bg-card border-r border-border/50 flex flex-col">
      {/* Header */}
      

      {/* Content */}
      <div className="flex-1 p-6 space-y-1">
        {/* Primeiros Passos */}
        <div>
          <Button 
            variant="ghost" 
            className={`w-full justify-start h-[34px] px-3 text-left text-[13px] font-medium transition-all duration-200 ${
              location.pathname === '/dashboard/setup' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => navigate('/dashboard/setup')}
          >
            📋 Primeiros Passos
          </Button>
        </div>

        {/* Feed */}
        <div>
          <Button 
            variant="ghost" 
            className={`w-full justify-start h-[34px] px-3 text-left text-[13px] font-medium transition-all duration-200 ${
              location.pathname === '/dashboard' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => navigate('/dashboard')}
          >
            📰 Feed
          </Button>
        </div>

        {/* Criar Categoria */}
        {categories.length > 0 && (
          <div>
            <Button variant="ghost" className="w-full justify-start h-[34px] px-3 text-left hover:bg-muted/50 text-muted-foreground text-[13px] font-medium">
              <Plus className="h-4 w-4 mr-2" />
              Criar categoria
            </Button>
          </div>
        )}

        <Separator />

        {/* Categories and Spaces Section */}
        <div className="space-y-2">
          {categories.map(category => <SpaceCategorySection key={category.id} category={category} isExpanded={isCategoryExpanded(category.id)} onToggle={() => toggleCategory(category.id)} onCreateSpace={openTypeSelection} onSpaceClick={spaceId => navigate(`/dashboard/space/${spaceId}`)} currentPath={location.pathname} />)}
        </div>

      </div>

      {/* Footer */}
      

      {/* Dialogs de Criação de Espaço */}
      <SpaceTypeSelectionDialog open={isTypeSelectionOpen} onClose={closeAllDialogs} onSelectType={selectTypeAndProceed} />
      
      <SpaceConfigurationDialog open={isConfigurationOpen} onClose={closeAllDialogs} onCreateSpace={createSpace} selectedType={selectedType} selectedCategoryId={selectedCategoryId} isCreating={isCreating} />
    </aside>;
}
interface SpaceCategorySectionProps {
  category: any;
  isExpanded: boolean;
  onToggle: () => void;
  onCreateSpace: (categoryId: string) => void;
  onSpaceClick: (spaceId: string) => void;
  currentPath: string;
}
function SpaceCategorySection({
  category,
  isExpanded,
  onToggle,
  onCreateSpace,
  onSpaceClick,
  currentPath
}: SpaceCategorySectionProps) {
  const {
    data: spaces = []
  } = useSpaces(category.id);
  return <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div className="w-full group">
          <Button variant="ghost" className="w-full justify-between p-3 h-auto text-left hover:bg-muted/50">
            <span className="text-sm font-medium text-muted-foreground">{category.name}</span>
            <div className="flex items-center gap-1">
              {spaces.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Plus clicked for category:', category.id);
                    onCreateSpace(category.id);
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </Button>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-1 ml-3">
        {spaces.map(space => {
        const IconComponent = getSpaceIcon(space.type);
        const isActiveSpace = currentPath === `/dashboard/space/${space.id}`;
        return <Button 
          key={space.id} 
          variant="ghost" 
          onClick={() => onSpaceClick(space.id)} 
          className={`w-full justify-start p-2 h-auto text-left text-sm transition-all duration-200 ${
            isActiveSpace 
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'hover:bg-muted/50'
          }`}
        >
              <IconComponent className="h-4 w-4 mr-2" />
              <span className={space.is_private && !isActiveSpace ? "text-muted-foreground" : ""}>{space.name}</span>
            </Button>;
      })}
        
        {spaces.length === 0 && (
          <Button variant="ghost" className="w-full justify-start p-2 h-auto text-left hover:bg-muted/50 text-muted-foreground text-sm" onClick={() => onCreateSpace(category.id)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar espaço
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>;
}