import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useConfetti } from '@/hooks/useConfetti';

interface OnboardingFinishStepProps {
  step: any;
  onComplete: (data?: Record<string, any>) => void;
  onSkip: () => void;
  isLoading: boolean;
}

export const OnboardingFinishStep = ({ 
  step, 
  onComplete, 
  isLoading 
}: OnboardingFinishStepProps) => {
  const navigate = useNavigate();
  const { triggerConfetti } = useConfetti();
  const config = step.config || {};

  useEffect(() => {
    if (config.celebration_type === 'confetti') {
      triggerConfetti();
    }
  }, [config.celebration_type, triggerConfetti]);

  const handleFinish = () => {
    onComplete();
    
    // Redirect after completion
    setTimeout(() => {
      if (config.redirect_url) {
        navigate(config.redirect_url);
      }
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🎉</div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">
                Parabéns!
              </h2>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                {config.message || 'Você concluiu o onboarding com sucesso!'}
              </p>
              
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  Sua conta está configurada e você já pode começar a usar a plataforma. 
                  Explore os espaços, participe das discussões e conecte-se com outros usuários!
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">Perfil completo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">Espaços selecionados</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">Interesses definidos</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button 
          onClick={handleFinish}
          disabled={isLoading}
          className="px-8"
          size="lg"
        >
          {isLoading ? 'Finalizando...' : 'Começar a usar a plataforma'}
        </Button>
      </div>
    </div>
  );
};