import { useState } from 'react';
import { Heart, MessageCircle, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePostInteractions } from '@/hooks/usePostInteractions';
import { cn } from '@/lib/utils';

interface PostInteractionsProps {
  postId: string;
}

export const PostInteractions = ({ postId }: PostInteractionsProps) => {
  const {
    likes,
    loves,
    comments,
    userLiked,
    userLoved,
    addInteraction,
    removeInteraction,
  } = usePostInteractions(postId);

  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    if (userLiked) {
      removeInteraction.mutate('like');
    } else {
      addInteraction.mutate({ type: 'like' });
    }
  };

  const handleLove = () => {
    if (userLoved) {
      removeInteraction.mutate('love');
    } else {
      addInteraction.mutate({ type: 'love' });
    }
  };

  return (
    <div className="space-y-3">
      {/* Estatísticas */}
      {(likes.length > 0 || loves.length > 0 || comments.length > 0) && (
        <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-3">
          <div className="flex items-center space-x-4">
            {(likes.length > 0 || loves.length > 0) && (
              <div className="flex items-center space-x-1">
                <div className="flex items-center -space-x-1">
                  {likes.length > 0 && (
                    <div className="bg-blue-500 rounded-full p-1">
                      <ThumbsUp className="h-3 w-3 text-white" />
                    </div>
                  )}
                  {loves.length > 0 && (
                    <div className="bg-red-500 rounded-full p-1">
                      <Heart className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <span>{likes.length + loves.length}</span>
              </div>
            )}
          </div>
          
          {comments.length > 0 && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:underline"
            >
              {comments.length} comentário{comments.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={cn(
            "flex items-center space-x-2 hover:bg-blue-50 hover:text-blue-600",
            userLiked && "text-blue-600 bg-blue-50"
          )}
        >
          <ThumbsUp className={cn("h-4 w-4", userLiked && "fill-current")} />
          <span>Curtir</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLove}
          className={cn(
            "flex items-center space-x-2 hover:bg-red-50 hover:text-red-600",
            userLoved && "text-red-600 bg-red-50"
          )}
        >
          <Heart className={cn("h-4 w-4", userLoved && "fill-current")} />
          <span>Amar</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 hover:bg-gray-50"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Comentar</span>
        </Button>
      </div>

      {/* Comentários */}
      {showComments && (
        <div className="space-y-3 pt-3 border-t">
          {comments.map((comment) => (
            <div key={comment.id} className="text-sm">
              <span className="font-medium">Usuário: </span>
              <span>{comment.comment_text}</span>
            </div>
          ))}
          
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              Nenhum comentário ainda.
            </p>
          )}
        </div>
      )}
    </div>
  );
};