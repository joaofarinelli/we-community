import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, ArrowLeft, ArrowRight, SkipForward, Sparkles } from 'lucide-react';
import { useOnboardingAssignment } from '@/hooks/useOnboardingAssignment';
import { OnboardingWelcomeStep } from './steps/OnboardingWelcomeStep';
import { OnboardingProfileStep } from './steps/OnboardingProfileStep';
import { OnboardingSpacesStep } from './steps/OnboardingSpacesStep';
import { OnboardingTagsStep } from './steps/OnboardingTagsStep';
import { OnboardingTermsStep } from './steps/OnboardingTermsStep';
import { OnboardingFinishStep } from './steps/OnboardingFinishStep';
import { useConfetti } from '@/hooks/useConfetti';
import { toast } from 'sonner';

interface OnboardingWizardProps {
  onClose?: () => void;
  onComplete?: () => void;
}

export const OnboardingWizard = ({ onClose, onComplete }: OnboardingWizardProps) => {
  const {
    assignment,
    progress,
    isLoadingAssignment,
    isLoadingProgress,
    startAssignment,
    updateStepProgress,
    completeAssignment,
    skipAssignment,
    isStarting,
    isUpdatingProgress,
    isCompleting,
    isSkipping,
  } = useOnboardingAssignment();

  const { triggerConfetti } = useConfetti();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Get steps from progress and sort by order
  const steps = useMemo(() => {
    if (!progress || progress.length === 0) return [];
    
    return progress
      .map(p => ({
        ...p.onboarding_steps,
        progress: p,
      }))
      .sort((a, b) => a.order_index - b.order_index);
  }, [progress]);

  const currentStep = steps[currentStepIndex];
  const progressPercentage = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  // Start assignment if it's pending
  const handleStart = () => {
    if (assignment && assignment.status === 'pending') {
      startAssignment(assignment.id);
    }
  };

  const handleStepComplete = async (data: Record<string, any> = {}) => {
    if (!currentStep) return;

    await updateStepProgress({
      stepId: currentStep.id,
      status: 'completed',
      data,
    });

    // Move to next step or complete
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleStepSkip = async () => {
    if (!currentStep) return;

    await updateStepProgress({
      stepId: currentStep.id,
      status: 'skipped',
    });

    // Move to next step or complete
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!assignment) return;

    await completeAssignment(assignment.id);

    // Trigger celebration
    if ((currentStep?.config as any)?.celebration_type === 'confetti') {
      triggerConfetti();
    }

    // Redirect or close
    setTimeout(() => {
      onComplete?.();
      onClose?.();
    }, 2000);
  };

  const handleSkipAll = () => {
    if (!assignment) return;
    if (confirm('Tem certeza que deseja pular o onboarding?')) {
      skipAssignment(assignment.id);
      onClose?.();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const renderCurrentStep = () => {
    if (!currentStep) return null;

    const stepProps = {
      step: currentStep,
      onComplete: handleStepComplete,
      onSkip: handleStepSkip,
      isLoading: isUpdatingProgress,
    };

    switch (currentStep.step_type) {
      case 'welcome':
        return <OnboardingWelcomeStep {...stepProps} />;
      case 'profile':
        return <OnboardingProfileStep {...stepProps} />;
      case 'spaces':
        return <OnboardingSpacesStep {...stepProps} />;
      case 'tags':
        return <OnboardingTagsStep {...stepProps} />;
      case 'terms':
        return <OnboardingTermsStep {...stepProps} />;
      case 'finish':
        return <OnboardingFinishStep {...stepProps} />;
      default:
        return null;
    }
  };

  if (isLoadingAssignment || isLoadingProgress) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-center text-muted-foreground">Carregando onboarding...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assignment || !steps.length) {
    return null;
  }

  // Show start screen for pending assignments
  if (assignment.status === 'pending') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Bem-vindo(a)!</CardTitle>
            <CardDescription className="text-base">
              Vamos configurar sua conta em alguns passos simples
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">{steps.length} passos</span>
              </div>
              <div className="space-y-1">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      step.progress.status === 'completed' 
                        ? 'bg-green-500' 
                        : 'bg-muted'
                    }`} />
                    <span className="text-muted-foreground">{step.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleStart} 
                disabled={isStarting}
                className="flex-1"
              >
                {isStarting ? 'Iniciando...' : 'Começar'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSkipAll}
                disabled={isSkipping}
              >
                Pular
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                Passo {currentStepIndex + 1} de {steps.length}
              </div>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {!currentStep?.is_required && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleStepSkip}
                disabled={isUpdatingProgress}
              >
                <SkipForward className="h-4 w-4 mr-1" />
                Pular
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            <Progress value={progressPercentage} className="w-full" />
            <div>
              <CardTitle className="text-xl">{currentStep?.title}</CardTitle>
              {currentStep?.description && (
                <CardDescription className="mt-1">
                  {currentStep.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {renderCurrentStep()}
        </CardContent>

        <div className="p-6 border-t bg-muted/30">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStepIndex
                      ? 'bg-primary'
                      : index < currentStepIndex
                      ? 'bg-green-500'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={() => handleStepComplete()}
              disabled={isUpdatingProgress}
            >
              {currentStepIndex === steps.length - 1 ? 'Finalizar' : 'Próximo'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};