import { Button } from '@/components/ui/button';
import { Pin, PinOff } from 'lucide-react';
import { usePinChallenge } from '@/hooks/usePinChallenge';

interface ChallengePinButtonProps {
  challengeId: string;
  isPinned: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}

export const ChallengePinButton = ({ 
  challengeId, 
  isPinned, 
  size = 'sm',
  variant = 'outline'
}: ChallengePinButtonProps) => {
  const pinChallenge = usePinChallenge();

  const handlePin = () => {
    pinChallenge.mutate({
      challengeId,
      isPinned: !isPinned
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePin}
      disabled={pinChallenge.isPending}
      title={isPinned ? 'Remover dos fixados' : 'Fixar no topo'}
    >
      {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
    </Button>
  );
};