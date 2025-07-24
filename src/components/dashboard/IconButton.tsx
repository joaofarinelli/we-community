import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
interface IconButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'sm' | 'default';
  className?: string;
}
export function IconButton({
  icon: Icon,
  onClick,
  variant = 'ghost',
  size = 'sm',
  className
}: IconButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={className}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}