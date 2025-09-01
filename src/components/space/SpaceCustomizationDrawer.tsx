import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useSpaceCategories } from '@/hooks/useSpaceCategories';
import { useUpdateSpace } from '@/hooks/useUpdateSpace';
import { useSpaceBanner } from '@/hooks/useSpaceBanner';
import { IconSelector } from '@/components/ui/icon-selector';
import { SpaceType } from '@/lib/spaceUtils';

interface SpaceCustomizationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  space: {
    id: string;
    name: string;
    category_id: string;
    is_private: boolean;
    type: string;
    custom_icon_type?: string;
    custom_icon_value?: string;
    layout_type?: string;
  };
}

export const SpaceCustomizationDrawer = ({ 
  open, 
  onOpenChange, 
  space 
}: SpaceCustomizationDrawerProps) => {
  const { data: categories = [] } = useSpaceCategories();
  const updateSpaceMutation = useUpdateSpace();
  const { bannerUrl, uploadBanner, removeBanner, isUploading, isRemoving } = useSpaceBanner(space.id);
  
  // Estados para as configurações
  const [spaceName, setSpaceName] = useState(space.name);
  const [categoryId, setCategoryId] = useState(space.category_id);
  const [hideFromSidebar, setHideFromSidebar] = useState(false);
  const [accessType, setAccessType] = useState(space.is_private ? 'private' : 'open');
  const [layoutType, setLayoutType] = useState(space.layout_type || 'feed');
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [topicNavigation, setTopicNavigation] = useState(false);
  const [customIconType, setCustomIconType] = useState<'default' | 'emoji' | 'image'>(
    (space.custom_icon_type as 'default' | 'emoji' | 'image') || 'default'
  );
  const [customIconValue, setCustomIconValue] = useState(space.custom_icon_value || '');

  const handleSave = () => {
    updateSpaceMutation.mutate({
      id: space.id,
      name: spaceName,
      category_id: categoryId,
      is_private: accessType !== 'open',
      custom_icon_type: customIconType,
      custom_icon_value: customIconValue || null,
      layout_type: layoutType as 'feed' | 'list' | 'card',
    }, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  const handleCancel = () => {
    // Resetar valores para o estado original
    setSpaceName(space.name);
    setCategoryId(space.category_id);
    setHideFromSidebar(false);
    setAccessType(space.is_private ? 'private' : 'open');
    setLayoutType(space.layout_type || 'feed');
    setShowRightSidebar(true);
    setTopicNavigation(false);
    setCustomIconType((space.custom_icon_type as 'default' | 'emoji' | 'image') || 'default');
    setCustomIconValue(space.custom_icon_value || '');
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="relative">
          <DrawerTitle>Personalizar espaço</DrawerTitle>
          <DrawerDescription>
            Configure as preferências e aparência do seu espaço
          </DrawerDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 h-6 w-6"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DrawerHeader>

        <div className="px-4 overflow-y-auto">
          <div className="max-w-[950px] mx-auto space-y-6 pb-6">
            {/* Seção Geral */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Geral</h3>
              
              <div className="space-y-2">
                <Label htmlFor="space-name">Nome do espaço</Label>
                <Input
                  id="space-name"
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  placeholder="Digite o nome do espaço"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-group">Grupo de categorias</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="hide-sidebar">Ocultar espaço da barra lateral</Label>
                <Switch
                  id="hide-sidebar"
                  checked={hideFromSidebar}
                  onCheckedChange={setHideFromSidebar}
                />
              </div>
            </div>

            <Separator />

            {/* Seção Ícone do Espaço */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Ícone do Espaço</h3>
              
              <IconSelector
                spaceType={space.type as SpaceType}
                iconType={customIconType}
                iconValue={customIconValue}
                onIconTypeChange={setCustomIconType}
                onIconValueChange={setCustomIconValue}
              />
            </div>

            <Separator />

            {/* Seção Acessos */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Acessos</h3>
              
              <RadioGroup value={accessType} onValueChange={setAccessType}>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="open" id="open" className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor="open" className="font-normal">Aberto</Label>
                    <p className="text-xs text-muted-foreground">
                      Qualquer pessoa da comunidade pode ver e participar
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="closed" id="closed" className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor="closed" className="font-normal">Fechado</Label>
                    <p className="text-xs text-muted-foreground">
                      Apenas membros autorizados podem ver e participar
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="private" id="private" className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor="private" className="font-normal">Privado</Label>
                    <p className="text-xs text-muted-foreground">
                      Apenas membros convidados podem ver e participar
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="secret" id="secret" className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor="secret" className="font-normal">Secreto</Label>
                    <p className="text-xs text-muted-foreground">
                      Apenas membros convidados podem ver e participar
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Seção Layout */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Layout</h3>
              
              <RadioGroup value={layoutType} onValueChange={setLayoutType}>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="feed" id="feed" />
                  <Label htmlFor="feed" className="font-normal">Feed</Label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="list" id="list" />
                  <Label htmlFor="list" className="font-normal">Lista</Label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="font-normal">Cartão</Label>
                </div>
              </RadioGroup>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-right-sidebar">Mostrar barra lateral direita</Label>
                <Switch
                  id="show-right-sidebar"
                  checked={showRightSidebar}
                  onCheckedChange={setShowRightSidebar}
                />
              </div>
            </div>

            <Separator />

            {/* Seção Navegação por tópicos */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Navegação por tópicos</h3>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="topic-navigation">
                  Fazer navegação única baseada nos tópicos
                </Label>
                <Switch
                  id="topic-navigation"
                  checked={topicNavigation}
                  onCheckedChange={setTopicNavigation}
                />
              </div>
            </div>

            <Separator />

            {/* Seção Banner */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Banner do Espaço</h3>
              
              {bannerUrl ? (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden border">
                    <img
                      src={bannerUrl}
                      alt="Banner do espaço"
                      className="w-full h-32 object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeBanner()}
                      disabled={isRemoving}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Alterar banner</Label>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) uploadBanner(file);
                        };
                        input.click();
                      }}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? 'Enviando...' : 'Alterar banner'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Banner do espaço</Label>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) uploadBanner(file);
                      };
                      input.click();
                    }}
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Enviando...' : 'Fazer upload do banner'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Recomendado: 1200x300 pixels
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DrawerFooter className="pt-4 pb-6">
          <div className="flex justify-end space-x-3 max-w-[950px] mx-auto w-full">
            <Button variant="outline" onClick={handleCancel} className="min-w-[100px]">
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              className="min-w-[120px]"
              disabled={updateSpaceMutation.isPending}
            >
              {updateSpaceMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};