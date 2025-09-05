import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, FileText } from 'lucide-react';
import type { OnboardingStep } from '@/hooks/useOnboardingSteps';

interface OnboardingTermsStepProps {
  step: any; // Accept the combined step+progress structure from wizard
  onComplete: (data?: Record<string, any>) => void;
  onSkip: () => void;
  isLoading?: boolean;
}

export const OnboardingTermsStep = ({ 
  step, 
  onComplete, 
  onSkip, 
  isLoading = false 
}: OnboardingTermsStepProps) => {
  const [hasAccepted, setHasAccepted] = useState(false);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const config = step.config || {};
  const {
    terms_text = '',
    terms_url = '',
    require_scroll = true,
    acceptance_label = 'Li e aceito os termos e condições',
  } = config;

  // Only require scrolling if there's actual content to scroll through AND it overflows
  const effectiveRequireScroll = require_scroll && terms_text.trim().length > 0 && hasOverflow;
  const canProceed = hasAccepted && (effectiveRequireScroll ? hasScrolledToEnd : true);

  // Check if content overflows and can be scrolled
  useEffect(() => {
    if (!terms_text.trim().length) {
      setHasScrolledToEnd(true);
      setHasOverflow(false);
      return;
    }

    const checkOverflow = () => {
      const scrollArea = scrollAreaRef.current;
      if (!scrollArea) return;

      const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
      if (!viewport) return;

      const { scrollHeight, clientHeight } = viewport;
      const overflow = scrollHeight > clientHeight + 1; // +1 for rounding errors
      
      setHasOverflow(overflow);
      
      // If no overflow, consider it scrolled to end
      if (!overflow) {
        setHasScrolledToEnd(true);
      }
    };

    // Check overflow after content is rendered
    const timer = setTimeout(checkOverflow, 100);

    // Also check on resize
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (scrollAreaRef.current) {
      resizeObserver.observe(scrollAreaRef.current);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [terms_text]);

  // Connect scroll listener to the actual scrollable viewport
  useEffect(() => {
    if (!effectiveRequireScroll || hasScrolledToEnd) return;

    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    // Find the Radix ScrollArea viewport
    const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      // Consider scrolled to end if within 10px of the bottom
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setHasScrolledToEnd(true);
      }
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [effectiveRequireScroll, hasScrolledToEnd]);

  const handleAcceptanceChange = (checked: boolean) => {
    setHasAccepted(checked);
  };

  const handleComplete = () => {
    if (!canProceed) return;
    
    onComplete({
      accepted_terms: true,
      accepted_at: new Date().toISOString(),
      terms_version: step.id, // Use step ID as version identifier
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-0">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Termos e Condições</h3>
                <p className="text-sm text-muted-foreground">
                  Por favor, leia e aceite nossos termos para continuar
                </p>
              </div>
            </div>

            {terms_url && (
              <div className="mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(terms_url, '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver termos completos
                </Button>
              </div>
            )}
          </div>

          {terms_text && (
            <ScrollArea 
              className="h-64 px-6"
              ref={scrollAreaRef}
            >
              <div className="py-4 pr-4">
                <div className="prose prose-sm max-w-none">
                  {terms_text.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3 text-sm leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
              
              {effectiveRequireScroll && !hasScrolledToEnd && (
                <div className="sticky bottom-0 bg-gradient-to-t from-background via-background/90 to-transparent p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Role até o final para continuar
                  </p>
                </div>
              )}
            </ScrollArea>
          )}

          {!terms_text && terms_url && (
            <div className="px-6 py-4 bg-muted/50 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Clique no botão acima para visualizar os termos em uma nova aba
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms-acceptance"
                checked={hasAccepted}
                onCheckedChange={handleAcceptanceChange}
                disabled={effectiveRequireScroll && !hasScrolledToEnd}
                className="mt-0.5"
              />
              <div className="flex-1">
                <label 
                  htmlFor="terms-acceptance" 
                  className={`text-sm cursor-pointer ${
                    effectiveRequireScroll && !hasScrolledToEnd 
                      ? 'text-muted-foreground' 
                      : 'text-foreground'
                  }`}
                >
                  {acceptance_label}
                </label>
                {effectiveRequireScroll && !hasScrolledToEnd && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Leia todo o conteúdo acima antes de aceitar
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              {!step.is_required && (
                <Button
                  variant="outline"
                  onClick={onSkip}
                  disabled={isLoading}
                >
                  Pular
                </Button>
              )}
              
              <div className={!step.is_required ? '' : 'ml-auto'}>
                <Button
                  onClick={handleComplete}
                  disabled={!canProceed || isLoading}
                  className="min-w-[120px]"
                >
                  {isLoading ? 'Processando...' : 'Aceitar e Continuar'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};