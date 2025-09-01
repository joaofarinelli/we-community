import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAvailableSpaces } from '@/hooks/useAvailableSpaces';
import { useManageSpaceMembers } from '@/hooks/useManageSpaceMembers';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { toast } from 'sonner';

interface OnboardingSpacesStepProps {
  step: any;
  onComplete: (data?: Record<string, any>) => void;
  onSkip: () => void;
  isLoading: boolean;
}

export const OnboardingSpacesStep = ({ 
  step, 
  onComplete, 
  onSkip, 
  isLoading 
}: OnboardingSpacesStepProps) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const { data: spaces = [] } = useAvailableSpaces();
  const { addMember } = useManageSpaceMembers();

  const config = step.config || {};
  const minSelection = config.min_selection || 1;
  const maxSelection = config.max_selection;

  const [selectedSpaces, setSelectedSpaces] = useState<string[]>([]);
  const [isJoining, setIsJoining] = useState(false);

  // Filter spaces based on config
  const availableSpaces = spaces.filter(space => 
    config.show_all_spaces !== false || space.visibility === 'public'
  );

  const handleSpaceToggle = (spaceId: string) => {
    setSelectedSpaces(prev => {
      if (prev.includes(spaceId)) {
        return prev.filter(id => id !== spaceId);
      } else {
        if (maxSelection && prev.length >= maxSelection) {
          toast.error(`Você pode selecionar no máximo ${maxSelection} espaços`);
          return prev;
        }
        return [...prev, spaceId];
      }
    });
  };

  const handleJoinSpaces = async () => {
    if (selectedSpaces.length < minSelection) {
      toast.error(`Selecione pelo menos ${minSelection} espaços`);
      return;
    }

    setIsJoining(true);
    try {
      // Join selected spaces
      for (const spaceId of selectedSpaces) {
        await addMember.mutateAsync({
          spaceId,
          userId: user!.id,
        });
      }

      onComplete({ selectedSpaces });
      toast.success(`Você entrou em ${selectedSpaces.length} espaços!`);
    } catch (error) {
      console.error('Erro ao entrar nos espaços:', error);
      toast.error('Erro ao entrar nos espaços');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🏠</div>
              <p className="text-muted-foreground">
                Escolha os espaços que mais interessam você para participar das discussões
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Selecione pelo menos {minSelection} espaço{minSelection > 1 ? 's' : ''}
                {maxSelection && ` (máximo ${maxSelection})`}
              </p>
            </div>

            {availableSpaces.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Nenhum espaço disponível no momento
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableSpaces.map((space) => (
                  <Card 
                    key={space.id}
                    className={`cursor-pointer transition-colors ${
                      selectedSpaces.includes(space.id)
                        ? 'ring-2 ring-primary'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleSpaceToggle(space.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={selectedSpaces.includes(space.id)}
                          onChange={() => handleSpaceToggle(space.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-foreground truncate">
                              {space.name}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {space.visibility}
                            </Badge>
                          </div>
                          {space.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {space.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {space.memberCount || 0} membros
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {selectedSpaces.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Espaços selecionados ({selectedSpaces.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedSpaces.map((spaceId) => {
                    const space = availableSpaces.find(s => s.id === spaceId);
                    return (
                      <Badge key={spaceId} variant="default">
                        {space?.name}
                      </Badge>
                    );
                  })}
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
            disabled={isLoading || isJoining}
          >
            Pular
          </Button>
        )}
        <Button 
          onClick={handleJoinSpaces}
          disabled={isLoading || isJoining || selectedSpaces.length < minSelection}
        >
          {isJoining ? 'Entrando...' : 'Continuar'}
        </Button>
      </div>
    </div>
  );
};