import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EmojiPickerComponent } from './emoji-picker';
import { ImageUpload } from './image-upload';
import { getSpaceIcon } from '@/lib/spaceUtils';
import { SpaceType } from '@/lib/spaceUtils';

interface IconSelectorProps {
  spaceType: SpaceType | null;
  iconType: 'default' | 'emoji' | 'image';
  iconValue?: string;
  onIconTypeChange: (type: 'default' | 'emoji' | 'image') => void;
  onIconValueChange: (value: string) => void;
}

export const IconSelector = ({
  spaceType,
  iconType,
  iconValue,
  onIconTypeChange,
  onIconValueChange
}: IconSelectorProps) => {
  const DefaultIcon = spaceType ? getSpaceIcon(spaceType) : null;

  const renderPreview = () => {
    switch (iconType) {
      case 'emoji':
        return iconValue ? (
          <span className="text-xl">{iconValue}</span>
        ) : (
          <span className="text-muted-foreground text-sm">Nenhum emoji selecionado</span>
        );
      case 'image':
        return iconValue ? (
          <img src={iconValue} alt="Icon preview" className="w-6 h-6 object-cover rounded" />
        ) : (
          <span className="text-muted-foreground text-sm">Nenhuma imagem selecionada</span>
        );
      default:
        return (
          <span className="text-xl">🔵</span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label>Ícone do Espaço</Label>
        <div className="flex items-center gap-2 px-2 py-1 bg-muted rounded">
          {renderPreview()}
        </div>
      </div>
      
      <Tabs value={iconType} onValueChange={(value) => onIconTypeChange(value as 'default' | 'emoji' | 'image')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="default">Padrão</TabsTrigger>
          <TabsTrigger value="emoji">Emoji</TabsTrigger>
          <TabsTrigger value="image">Imagem</TabsTrigger>
        </TabsList>
        
        <TabsContent value="default" className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Usar o ícone padrão 🔵 para todos os espaços
          </p>
        </TabsContent>
        
        <TabsContent value="emoji" className="space-y-2">
          <EmojiPickerComponent
            value={iconValue}
            onChange={onIconValueChange}
            placeholder="Escolher emoji"
          />
        </TabsContent>
        
        <TabsContent value="image" className="space-y-2">
          <ImageUpload
            value={iconValue}
            onChange={onIconValueChange}
            onRemove={() => onIconValueChange('')}
          />
          <p className="text-xs text-muted-foreground">
            Imagens quadradas funcionam melhor. Máximo 1MB.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
};