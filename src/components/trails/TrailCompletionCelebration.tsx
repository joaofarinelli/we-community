import { useEffect, useState } from 'react';
import { CheckCircle, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useConfetti } from '@/hooks/useConfetti';

interface TrailCompletionCelebrationProps {
  trailName: string;
  badgeName?: string;
  coinsAwarded?: number;
  onDismiss: () => void;
}

export const TrailCompletionCelebration = ({
  trailName,
  badgeName,
  coinsAwarded,
  onDismiss,
}: TrailCompletionCelebrationProps) => {
  const [visible, setVisible] = useState(false);
  const { triggerTrailCompletionConfetti } = useConfetti();

  useEffect(() => {
    // Show with animation
    setTimeout(() => setVisible(true), 100);
    
    // Trigger confetti
    setTimeout(() => {
      triggerTrailCompletionConfetti();
    }, 500);
  }, [triggerTrailCompletionConfetti]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleDismiss}
    >
      <Card 
        className={`max-w-md mx-4 transition-all duration-500 ${
          visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              {badgeName && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 text-yellow-600" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-green-700">
              🎉 Parabéns!
            </h2>
            <p className="text-lg font-semibold">
              Você concluiu a trilha
            </p>
            <p className="text-primary font-medium">
              "{trailName}"
            </p>
          </div>

          {(badgeName || coinsAwarded) && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              {badgeName && (
                <div className="flex items-center justify-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium">
                    Selo conquistado: {badgeName}
                  </span>
                </div>
              )}
              {coinsAwarded && coinsAwarded > 0 && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">🪙</span>
                  <span className="font-medium">
                    +{coinsAwarded} moedas
                  </span>
                </div>
              )}
            </div>
          )}

          <Button onClick={handleDismiss} className="w-full">
            Continuar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};