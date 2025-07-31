import confetti from 'canvas-confetti';

export const useConfetti = () => {
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const triggerTrailCompletionConfetti = () => {
    // Primeiro confetti
    confetti({
      particleCount: 150,
      spread: 60,
      origin: { x: 0.3, y: 0.7 },
      colors: ['#22c55e', '#10b981', '#06d6a0']
    });
    
    // Segundo confetti com delay
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 60,
        origin: { x: 0.7, y: 0.7 },
        colors: ['#22c55e', '#10b981', '#06d6a0']
      });
    }, 300);

    // Terceiro confetti central
    setTimeout(() => {
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { x: 0.5, y: 0.6 },
        colors: ['#22c55e', '#10b981', '#06d6a0', '#fbbf24', '#f59e0b']
      });
    }, 600);
  };

  return {
    triggerConfetti,
    triggerTrailCompletionConfetti
  };
};