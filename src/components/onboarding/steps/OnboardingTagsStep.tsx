import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTags } from '@/hooks/useTags';
import { useUserTags } from '@/hooks/useUserTags';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

interface OnboardingTagsStepProps {
  step: any;
  onComplete: (data?: Record<string, any>) => void;
  onSkip: () => void;
  isLoading: boolean;
}

export const OnboardingTagsStep = ({ 
  step, 
  onComplete, 
  onSkip, 
  isLoading 
}: OnboardingTagsStepProps) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const { data: allTags = [] } = useTags();
  const { data: userTags = [] } = useUserTags();

  const config = step.config || {};
  const minSelection = config.min_selection || 1;
  const maxSelection = config.max_selection || 5;
  const allowCustomTags = config.allow_custom_tags !== false;

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleTagToggle = (tagName: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagName)) {
        return prev.filter(name => name !== tagName);
      } else {
        if (prev.length >= maxSelection) {
          toast.error(`Você pode selecionar no máximo ${maxSelection} tags`);
          return prev;
        }
        return [...prev, tagName];
      }
    });
  };

  const handleAddCustomTag = () => {
    if (!customTag.trim()) return;
    
    if (!allowCustomTags) {
      toast.error('Tags personalizadas não são permitidas');
      return;
    }

    if (selectedTags.length >= maxSelection) {
      toast.error(`Você pode selecionar no máximo ${maxSelection} tags`);
      return;
    }

    if (selectedTags.includes(customTag.trim())) {
      toast.error('Esta tag já foi selecionada');
      return;
    }

    setSelectedTags(prev => [...prev, customTag.trim()]);
    setCustomTag('');
  };

  const handleSaveTags = async () => {
    if (selectedTags.length < minSelection) {
      toast.error(`Selecione pelo menos ${minSelection} tags`);
      return;
    }

    setIsSaving(true);
    try {
      // First, create any new tags that don't exist
      for (const tagName of selectedTags) {
        const existingTag = allTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
        if (!existingTag && allowCustomTags) {
          await supabase
            .from('tags')
            .insert({
              name: tagName,
              company_id: currentCompanyId,
              created_by: user!.id,
            });
        }
      }

      // Then, add user tags
      const userTagInserts = selectedTags.map(tagName => ({
        user_id: user!.id,
        company_id: currentCompanyId,
        tag_name: tagName,
      }));

      const { error } = await supabase
        .from('user_tags')
        .insert(userTagInserts);

      if (error) throw error;

      onComplete({ selectedTags });
      toast.success(`${selectedTags.length} tags adicionadas ao seu perfil!`);
    } catch (error) {
      console.error('Erro ao salvar tags:', error);
      toast.error('Erro ao salvar tags');
    } finally {
      setIsSaving(false);
    }
  };

  // Available tags that aren't already selected
  const availableTags = allTags.filter(tag => 
    !selectedTags.includes(tag.name) &&
    !userTags.some(ut => ut.tag_name === tag.name)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🏷️</div>
              <p className="text-muted-foreground">
                Selecione seus interesses para personalizar sua experiência
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Selecione entre {minSelection} e {maxSelection} tags
              </p>
            </div>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Tags Selecionadas ({selectedTags.length}/{maxSelection})</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="default"
                      className="cursor-pointer"
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Available Tags */}
            {availableTags.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Tags Disponíveis</h3>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Badge 
                      key={tag.id} 
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleTagToggle(tag.name)}
                    >
                      {tag.name}
                      <Plus className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Tag Input */}
            {allowCustomTags && selectedTags.length < maxSelection && (
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Adicionar Tag Personalizada</h3>
                <div className="flex gap-2">
                  <Input
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="Digite uma nova tag..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCustomTag();
                      }
                    }}
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleAddCustomTag}
                    disabled={!customTag.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-3">
        {config.allow_skip && (
          <Button 
            variant="outline" 
            onClick={onSkip}
            disabled={isLoading || isSaving}
          >
            Pular
          </Button>
        )}
        <Button 
          onClick={handleSaveTags}
          disabled={isLoading || isSaving || selectedTags.length < minSelection}
        >
          {isSaving ? 'Salvando...' : 'Continuar'}
        </Button>
      </div>
    </div>
  );
};