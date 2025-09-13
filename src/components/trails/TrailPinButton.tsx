import { Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TrailTemplate, usePinTrailTemplate } from '@/hooks/useTrailTemplates';
import { useIsAdmin } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';

interface TrailPinButtonProps {
  template: TrailTemplate;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export const TrailPinButton = ({ template, className, size = 'sm' }: TrailPinButtonProps) => {
  const isAdmin = useIsAdmin();
  const pinTrailTemplate = usePinTrailTemplate();

  if (!isAdmin) return null;

  const handleTogglePin = () => {
    pinTrailTemplate.mutate({
      templateId: template.id,
      isPinned: !template.is_pinned,
      pinnedOrder: template.is_pinned ? undefined : Date.now(), // Simple ordering by creation time
    });
  };

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleTogglePin}
      disabled={pinTrailTemplate.isPending}
      className={cn(
        'gap-1',
        template.is_pinned && 'bg-primary/10 border-primary text-primary hover:bg-primary/20',
        className
      )}
      title={template.is_pinned ? 'Remover do topo' : 'Fixar no topo'}
    >
      {template.is_pinned ? (
        <PinOff className="h-3 w-3" />
      ) : (
        <Pin className="h-3 w-3" />
      )}
      <span className="sr-only">
        {template.is_pinned ? 'Remover do topo' : 'Fixar no topo'}
      </span>
    </Button>
  );
};