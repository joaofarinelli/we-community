import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { AccessGroup } from '@/hooks/useAccessGroups';
import { useSpaces } from '@/hooks/useSpaces';
import { useCourses } from '@/hooks/useCourses';
import { useAccessGroupSpaces } from '@/hooks/useAccessGroupSpaces';
import { useAccessGroupCourses } from '@/hooks/useAccessGroupCourses';

interface AccessGroupAccessTabProps {
  accessGroup: AccessGroup;
}

interface AccessItem {
  id: string;
  name: string;
  type: 'space' | 'course';
}

export const AccessGroupAccessTab = ({ accessGroup }: AccessGroupAccessTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableItems, setAvailableItems] = useState<AccessItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<AccessItem[]>([]);

  const { data: spaces } = useSpaces();
  const { data: courses } = useCourses();
  const { spaces: groupSpaces, updateSpaces } = useAccessGroupSpaces(accessGroup.id);
  const { courses: groupCourses, updateCourses } = useAccessGroupCourses(accessGroup.id);

  useEffect(() => {
    // Combine spaces and courses into available items
    const spaceItems: AccessItem[] = ((spaces as any) || []).map((space: any) => ({
      id: space.id,
      name: space.name,
      type: 'space' as const
    }));

    const courseItems: AccessItem[] = ((courses as any) || []).map((course: any) => ({
      id: course.id,
      name: course.title,
      type: 'course' as const
    }));

    const allItems = [...spaceItems, ...courseItems];
    
    // Get currently selected items
    const selectedSpaceIds = groupSpaces.map(gs => gs.space_id);
    const selectedCourseIds = groupCourses.map(gc => gc.course_id);
    const currentlySelected = allItems.filter(item => 
      (item.type === 'space' && selectedSpaceIds.includes(item.id)) ||
      (item.type === 'course' && selectedCourseIds.includes(item.id))
    );
    
    // Set available and selected items
    setSelectedItems(currentlySelected);
    setAvailableItems(allItems.filter(item => !currentlySelected.find(s => s.id === item.id)));
  }, [spaces, courses, groupSpaces, groupCourses]);

  // Filter items based on search
  const filteredAvailable = availableItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredSelected = selectedItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Move item between lists
  const moveItem = (item: AccessItem, fromAvailable: boolean) => {
    if (fromAvailable) {
      setSelectedItems([...selectedItems, item]);
      setAvailableItems(availableItems.filter(i => i.id !== item.id));
    } else {
      setAvailableItems([...availableItems, item]);
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    }
  };

  // Move all items
  const addAll = () => {
    setSelectedItems([...selectedItems, ...availableItems]);
    setAvailableItems([]);
  };

  const removeAll = () => {
    setAvailableItems([...availableItems, ...selectedItems]);
    setSelectedItems([]);
  };

  const handleSave = async () => {
    try {
      const spaceIds = selectedItems.filter(item => item.type === 'space').map(item => item.id);
      const courseIds = selectedItems.filter(item => item.type === 'course').map(item => item.id);

      // Update spaces and courses simultaneously
      await Promise.all([
        updateSpaces.mutateAsync({ accessGroupId: accessGroup.id, spaceIds }),
        updateCourses.mutateAsync({ accessGroupId: accessGroup.id, courseIds })
      ]);
    } catch (error) {
      console.error('Error saving access configuration:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-1">Acesso</h3>
        <p className="text-sm text-muted-foreground">
          Escolha os grupos de espaços e os espaços que farão parte deste grupo de acesso
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 h-[400px]">
        {/* Left Column - No Access */}
        <div className="border rounded-lg flex flex-col">
          <div className="flex items-center justify-between p-4 border-b bg-muted/50">
            <span className="font-medium text-sm">SEM ACESSO</span>
            <Button 
              variant="link" 
              size="sm" 
              className="text-xs text-muted-foreground h-auto p-0"
              onClick={addAll}
              disabled={availableItems.length === 0}
            >
              Adicionar todos
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {filteredAvailable.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum item disponível
              </p>
            ) : (
              <div className="space-y-1">
                {filteredAvailable.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => moveItem(item, true)}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer text-sm"
                  >
                    <span className="text-xs">{item.type === 'space' ? '👥' : '📚'}</span>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Access */}
        <div className="border rounded-lg flex flex-col">
          <div className="flex items-center justify-between p-4 border-b bg-primary/10">
            <span className="font-medium text-sm">ACESSO</span>
            <Button 
              variant="link" 
              size="sm" 
              className="text-xs text-muted-foreground h-auto p-0"
              onClick={removeAll}
              disabled={selectedItems.length === 0}
            >
              Remover todos
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {filteredSelected.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum acesso configurado
              </p>
            ) : (
              <div className="space-y-1">
                {filteredSelected.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => moveItem(item, false)}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer text-sm"
                  >
                    <span className="text-xs">{item.type === 'space' ? '👥' : '📚'}</span>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          className="bg-primary text-primary-foreground"
          disabled={updateSpaces.isPending || updateCourses.isPending}
        >
          {(updateSpaces.isPending || updateCourses.isPending) ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>
    </div>
  );
};