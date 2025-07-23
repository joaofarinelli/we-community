import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ExternalLink, Video, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSpaceCategories } from '@/hooks/useSpaceCategories';
import { useSpaces } from '@/hooks/useSpaces';
import { useCreateSpace } from '@/hooks/useCreateSpace';
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
  const {
    data: categories = []
  } = useSpaceCategories();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(() => categories.map(cat => cat.id));
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
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]);
  };
  return <aside className="w-[280px] h-screen bg-card border-r border-border/50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <h2 className="text-lg font-semibold">Primeiros Passos</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 hover:bg-muted/70">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Feed */}
        <div>
          <Button variant="ghost" className="w-full justify-start p-3 h-auto text-left hover:bg-muted/50">
            Feed
          </Button>
        </div>

        <Separator />

        {/* Categories and Spaces Section */}
        <div className="space-y-2">
          {categories.map(category => <SpaceCategorySection key={category.id} category={category} isExpanded={expandedCategories.includes(category.id)} onToggle={() => toggleCategory(category.id)} onCreateSpace={openTypeSelection} onSpaceClick={spaceId => navigate(`/dashboard/space/${spaceId}`)} />)}
          
          {categories.length > 0 && <Button variant="ghost" className="w-full justify-start p-3 h-auto text-left hover:bg-muted/50 text-muted-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Criar categoria
            </Button>}
        </div>

        <Separator />

        {/* Links Section */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Links</h3>
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-between p-3 h-auto text-left hover:bg-muted/50">
              <span>Baixe o aplicativo Android</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="ghost" className="w-full justify-between p-3 h-auto text-left hover:bg-muted/50">
              <span>Baixe o aplicativo iOS</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="ghost" className="w-full justify-start p-3 h-auto text-left hover:bg-muted/50">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar link
            </Button>
          </div>
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
}
function SpaceCategorySection({
  category,
  isExpanded,
  onToggle,
  onCreateSpace,
  onSpaceClick
}: SpaceCategorySectionProps) {
  const {
    data: spaces = []
  } = useSpaces(category.id);
  return <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-3 h-auto text-left hover:bg-muted/50">
          <span className="text-sm font-medium text-muted-foreground">{category.name}</span>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-1 ml-3">
        {spaces.map(space => {
        const IconComponent = getSpaceIcon(space.type);
        return <Button key={space.id} variant="ghost" onClick={() => onSpaceClick(space.id)} className="w-full justify-start p-2 h-auto text-left hover:bg-muted/50 text-sm">
              <IconComponent className="h-4 w-4 mr-2" />
              <span className={space.is_private ? "text-muted-foreground" : ""}>{space.name}</span>
            </Button>;
      })}
        
        <Button variant="ghost" className="w-full justify-start p-2 h-auto text-left hover:bg-muted/50 text-muted-foreground text-sm" onClick={() => onCreateSpace(category.id)}>
          <Plus className="h-4 w-4 mr-2" />
          Criar espaço
        </Button>
      </CollapsibleContent>
    </Collapsible>;
}