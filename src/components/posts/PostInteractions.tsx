import { useState } from 'react';
import { MessageCircle, ThumbsUp, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePostInteractions } from '@/hooks/usePostInteractions';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PostInteractionsProps {
  postId: string;
}

export const PostInteractions = ({ postId }: PostInteractionsProps) => {
  const {
    likes,
    comments,
    userLiked,
    addInteraction,
    removeInteraction,
  } = usePostInteractions(postId);

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleLike = () => {
    if (userLiked) {
      removeInteraction.mutate('like');
    } else {
      addInteraction.mutate({ type: 'like' });
    }
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      addInteraction.mutate({ 
        type: 'comment', 
        commentText: commentText.trim() 
      });
      setCommentText('');
    }
  };

  return (
    <div className="space-y-3">
      {/* Estatísticas */}
      {(likes.length > 0 || comments.length > 0) && (
        <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-3">
          <div className="flex items-center space-x-4">
            {likes.length > 0 && (
              <div className="flex items-center space-x-1">
                <div className="bg-blue-500 rounded-full p-1">
                  <ThumbsUp className="h-3 w-3 text-white" />
                </div>
                <span>{likes.length}</span>
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
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 hover:bg-muted"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Comentar</span>
        </Button>
      </div>

      {/* Área de Comentários */}
      {showComments && (
        <div className="space-y-4 pt-3 border-t">
          {/* Formulário para novo comentário */}
          <div className="flex space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                U
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Escreva um comentário..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[60px] resize-none"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || addInteraction.isPending}
                  className="flex items-center space-x-1"
                >
                  <Send className="h-3 w-3" />
                  <span>Comentar</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de comentários */}
          <div className="space-y-3">
            {comments.map((comment) => {
              const authorName = comment.profiles 
                ? `${comment.profiles.first_name} ${comment.profiles.last_name}`
                : 'Usuário';
              
              const authorInitials = comment.profiles
                ? `${comment.profiles.first_name[0]}${comment.profiles.last_name[0]}`
                : 'U';

              return (
                <div key={comment.id} className="flex space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {authorInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">{authorName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{comment.comment_text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {comments.length === 0 && (
              <p className="text-sm text-muted-foreground italic text-center py-4">
                Nenhum comentário ainda. Seja o primeiro a comentar!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};