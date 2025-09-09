import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Zap } from 'lucide-react';

interface DifficultyBadgeProps {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  className?: string;
}

export const DifficultyBadge = ({ difficulty, className }: DifficultyBadgeProps) => {
  const getDifficultyConfig = (level: string) => {
    switch (level) {
      case 'beginner':
        return {
          label: 'Básico',
          icon: Star,
          variant: 'secondary' as const,
          className: 'rounded-full bg-white/5 text-white/80 hover:bg-white/10 px-3 py-1 text-xs gap-1'
        };
      case 'intermediate':
        return {
          label: 'Intermediário',
          icon: TrendingUp,
          variant: 'secondary' as const,
          className: 'rounded-full bg-white/5 text-white/80 hover:bg-white/10 px-3 py-1 text-xs gap-1'
        };
      case 'advanced':
        return {
          label: 'Avançado',
          icon: Zap,
          variant: 'secondary' as const,
          className: 'rounded-full bg-white/5 text-white/80 hover:bg-white/10 px-3 py-1 text-xs gap-1'
        };
      default:
        return {
          label: 'Básico',
          icon: Star,
          variant: 'secondary' as const,
          className: 'rounded-full bg-white/5 text-white/80 hover:bg-white/10 px-3 py-1 text-xs gap-1'
        };
    }
  };

  const config = getDifficultyConfig(difficulty);
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} ${className}`}
    >
      <Icon className="h-3 w-3 mr-1 opacity-80" />
      {config.label}
    </Badge>
  );
};