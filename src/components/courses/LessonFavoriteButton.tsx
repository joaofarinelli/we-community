import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { useLessonFavorites } from '@/hooks/useLessonFavorites';

interface LessonFavoriteButtonProps {
  lessonId: string;
}

export const LessonFavoriteButton = ({ lessonId }: LessonFavoriteButtonProps) => {
  const { isFavorited, toggleFavorite, isLoading } = useLessonFavorites(lessonId);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => toggleFavorite()}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      <Star 
        className={`h-4 w-4 ${isFavorited ? 'fill-yellow-500 text-yellow-500' : ''}`}
      />
      {isFavorited ? 'Favoritado' : 'Favoritar'}
    </Button>
  );
};