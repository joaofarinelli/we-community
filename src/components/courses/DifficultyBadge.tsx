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
          label: 'Iniciante',
          icon: Star,
          variant: 'secondary' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-100'
        };
      case 'intermediate':
        return {
          label: 'Intermediário',
          icon: TrendingUp,
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
        };
      case 'advanced':
        return {
          label: 'Avançado',
          icon: Zap,
          variant: 'secondary' as const,
          className: 'bg-red-100 text-red-800 hover:bg-red-100'
        };
      default:
        return {
          label: 'Iniciante',
          icon: Star,
          variant: 'secondary' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-100'
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
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};