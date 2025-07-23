import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSpaces } from '@/hooks/useSpaces';
import { useSpace } from '@/hooks/useSpace';

interface SpaceSelectorProps {
  selectedSpaceId: string;
  onSpaceChange: (spaceId: string) => void;
}

export const SpaceSelector = ({ selectedSpaceId, onSpaceChange }: SpaceSelectorProps) => {
  const { data: allSpaces } = useSpaces();
  const { data: selectedSpace } = useSpace(selectedSpaceId);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>Publicando em:</span>
      <Select value={selectedSpaceId} onValueChange={onSpaceChange}>
        <SelectTrigger className="w-auto border-none bg-transparent p-0 h-auto font-medium text-foreground hover:text-primary">
          <SelectValue placeholder="Selecione um espaço">
            {selectedSpace?.name}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {allSpaces?.map((space) => (
            <SelectItem key={space.id} value={space.id}>
              {space.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};