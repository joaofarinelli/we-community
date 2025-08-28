import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCompanyTheme } from '@/hooks/useCompanyTheme';
import { Palette, Sun, Moon, Monitor } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Azul Escuro', value: '#334155' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Índigo', value: '#6366F1' },
  { name: 'Roxo', value: '#8B5CF6' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Laranja', value: '#F97316' },
  { name: 'Vermelho', value: '#EF4444' },
];

export const ThemeConfiguration = () => {
  const { themeConfig, updateThemeMode, updatePrimaryColor, updateTextColor, updateButtonTextColor, isLoading, isUpdating } = useCompanyTheme();
  const [selectedColor, setSelectedColor] = useState(themeConfig?.primary_color || '#334155');
  const [selectedTextColor, setSelectedTextColor] = useState(themeConfig?.text_color || '#F0F3F5');
  const [selectedButtonTextColor, setSelectedButtonTextColor] = useState(themeConfig?.button_text_color || '#FFFFFF');
  const [selectedMode, setSelectedMode] = useState(themeConfig?.theme_mode || 'light');

  // Sync local state with themeConfig when it loads
  useEffect(() => {
    if (themeConfig) {
      setSelectedColor(themeConfig.primary_color || '#334155');
      setSelectedTextColor(themeConfig.text_color || '#F0F3F5');
      setSelectedButtonTextColor(themeConfig.button_text_color || '#FFFFFF');
      setSelectedMode(themeConfig.theme_mode || 'light');
    }
  }, [themeConfig]);

  const handleSaveChanges = () => {
    if (selectedMode !== themeConfig?.theme_mode) {
      updateThemeMode(selectedMode);
    }
    if (selectedColor !== themeConfig?.primary_color) {
      updatePrimaryColor(selectedColor);
    }
    if (selectedTextColor !== themeConfig?.text_color) {
      updateTextColor(selectedTextColor);
    }
    if (selectedButtonTextColor !== themeConfig?.button_text_color) {
      updateButtonTextColor(selectedButtonTextColor);
    }
  };

  const hasChanges = 
    selectedMode !== themeConfig?.theme_mode || 
    selectedColor !== themeConfig?.primary_color ||
    selectedTextColor !== themeConfig?.text_color ||
    selectedButtonTextColor !== themeConfig?.button_text_color;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Configurações de Tema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            Carregando configurações...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Configurações de Tema
        </CardTitle>
        <CardDescription>
          Configure o tema e a cor primária da sua empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Modo do Tema */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Modo do Tema</Label>
          <RadioGroup 
            value={selectedMode} 
            onValueChange={(value) => setSelectedMode(value as 'light' | 'dark' | 'auto')}
            className="grid grid-cols-3 gap-4"
          >
            <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                <Sun className="h-4 w-4" />
                Claro
              </Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                <Moon className="h-4 w-4" />
                Escuro
              </Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="auto" id="auto" />
              <Label htmlFor="auto" className="flex items-center gap-2 cursor-pointer">
                <Monitor className="h-4 w-4" />
                Auto
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Cor Primária */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Cor Primária</Label>
          <div className="grid grid-cols-4 gap-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
                className={`
                  relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all
                  ${selectedColor === color.value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <div 
                  className="w-8 h-8 rounded-full border border-border"
                  style={{ backgroundColor: color.value }}
                />
                <span className="text-xs font-medium">{color.name}</span>
                {selectedColor === color.value && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cor Personalizada */}
        <div className="space-y-3">
          <Label htmlFor="custom-color" className="text-base font-medium">
            Cor Personalizada
          </Label>
          <div className="flex items-center gap-3">
            <input
              id="custom-color"
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-12 h-12 rounded border border-border cursor-pointer"
            />
            <input
              type="text"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              placeholder="#334155"
              className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Cor de Texto */}
        <div className="space-y-3">
          <Label htmlFor="text-color" className="text-base font-medium">
            Cor de Texto
          </Label>
          <div className="flex items-center gap-3">
            <input
              id="text-color"
              type="color"
              value={selectedTextColor}
              onChange={(e) => setSelectedTextColor(e.target.value)}
              className="w-12 h-12 rounded border border-border cursor-pointer"
            />
            <input
              type="text"
              value={selectedTextColor}
              onChange={(e) => setSelectedTextColor(e.target.value)}
              placeholder="#F0F3F5"
              className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Cor de Texto em Botões */}
        <div className="space-y-3">
          <Label htmlFor="button-text-color" className="text-base font-medium">
            Cor de Texto em Botões
          </Label>
          <div className="flex items-center gap-3">
            <input
              id="button-text-color"
              type="color"
              value={selectedButtonTextColor}
              onChange={(e) => setSelectedButtonTextColor(e.target.value)}
              className="w-12 h-12 rounded border border-border cursor-pointer"
            />
            <input
              type="text"
              value={selectedButtonTextColor}
              onChange={(e) => setSelectedButtonTextColor(e.target.value)}
              placeholder="#FFFFFF"
              className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Preview</Label>
          <div className="p-4 border rounded-lg bg-background">
            <div className="flex items-center gap-3 flex-wrap">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedColor }}
              />
              <Button 
                size="sm"
                style={{ 
                  backgroundColor: selectedColor,
                  borderColor: selectedColor,
                  color: selectedButtonTextColor
                }}
              >
                Botão de Exemplo
              </Button>
              <div 
                className="px-2 py-1 rounded text-sm font-medium"
                style={{ 
                  backgroundColor: selectedColor,
                  color: selectedButtonTextColor
                }}
              >
                Badge
              </div>
              <span 
                className="text-sm"
                style={{ color: selectedTextColor }}
              >
                Exemplo de texto
              </span>
            </div>
          </div>
        </div>

        {/* Botão Salvar */}
        {hasChanges && (
          <Button 
            onClick={handleSaveChanges}
            disabled={isUpdating}
            className="w-full"
          >
            {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};