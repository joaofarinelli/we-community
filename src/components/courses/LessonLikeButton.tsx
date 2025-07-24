import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useLessonLikes } from '@/hooks/useLessonLikes';

interface LessonLikeButtonProps {
  lessonId: string;
}

export const LessonLikeButton = ({ lessonId }: LessonLikeButtonProps) => {
  const { data: likes, toggleLike, isLiked, isLoading } = useLessonLikes(lessonId);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => toggleLike()}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      <Heart 
        className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
      />
      <span>{likes?.length || 0}</span>
    </Button>
  );
};