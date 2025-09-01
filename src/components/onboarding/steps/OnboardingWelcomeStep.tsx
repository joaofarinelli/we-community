import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OnboardingWelcomeStepProps {
  step: any;
  onComplete: (data?: Record<string, any>) => void;
  onSkip: () => void;
  isLoading: boolean;
}

export const OnboardingWelcomeStep = ({ 
  step, 
  onComplete, 
  onSkip, 
  isLoading 
}: OnboardingWelcomeStepProps) => {
  const config = step.config || {};

  return (
    <div className="space-y-6">
      {config.image_url && (
        <div className="flex justify-center">
          <img
            src={config.image_url}
            alt="Welcome"
            className="max-w-full h-auto max-h-64 object-contain rounded-lg"
          />
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="text-4xl mb-4">👋</div>
            <p className="text-lg text-foreground leading-relaxed">
              {config.message || 'Bem-vindo(a) à nossa plataforma!'}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-3">
        {config.show_skip_button && (
          <Button 
            variant="outline" 
            onClick={onSkip}
            disabled={isLoading}
          >
            Pular
          </Button>
        )}
        <Button 
          onClick={() => onComplete()}
          disabled={isLoading}
        >
          {isLoading ? 'Carregando...' : 'Continuar'}
        </Button>
      </div>
    </div>
  );
};