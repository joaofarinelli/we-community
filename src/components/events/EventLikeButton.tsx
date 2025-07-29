import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useEventLikes } from "@/hooks/useEventLikes";

interface EventLikeButtonProps {
  eventId: string;
}

export const EventLikeButton = ({ eventId }: EventLikeButtonProps) => {
  const { userLike, likesCount, toggleLike } = useEventLikes(eventId);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => toggleLike.mutate()}
      disabled={toggleLike.isPending}
      className="gap-2"
    >
      <Heart 
        className={`h-4 w-4 ${userLike ? 'fill-current text-destructive' : ''}`} 
      />
      {likesCount} {likesCount === 1 ? 'Curtida' : 'Curtidas'}
    </Button>
  );
};