import { useState } from 'react';
import { MessageCircle, ThumbsUp, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePostInteractions } from '@/hooks/usePostInteractions';
import { CommentItem } from './CommentItem';
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
    commentsWithReplies,
    userLiked,
    addInteraction,
    removeInteraction,
    deleteComment,
  } = usePostInteractions(postId);

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

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

  const handleReply = async (parentCommentId: string, replyText: string) => {
    await addInteraction.mutateAsync({
      type: 'comment',
      commentText: replyText.trim(),
      parentCommentId
    });
  };

  const handleStartReply = (commentId: string) => {
    setReplyingTo(commentId);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  return (
    <div className="space-y-3">
      {/* Botões de Ação e Contadores */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn(
              "flex items-center space-x-2 hover:bg-primary/10 hover:text-primary",
              userLiked && "bg-primary text-primary-foreground"
            )}
          >
            <ThumbsUp className="h-4 w-4" />
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
        
        {/* Contadores do lado direito */}
        {((likes?.length || 0) > 0 || (comments?.length || 0) > 0) && (
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            {(likes?.length || 0) > 0 && (
              <span>{likes?.length || 0} curtidas</span>
            )}
            {(comments?.length || 0) > 0 && (
              <span>{comments?.length || 0} comentário{(comments?.length || 0) !== 1 ? 's' : ''}</span>
            )}
          </div>
        )}
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
          <div className="space-y-4">
            {(commentsWithReplies || []).map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replies={comment.replies}
                onReply={handleReply}
                onDeleteComment={(commentId) => deleteComment.mutate(commentId)}
                onStartReply={handleStartReply}
                onCancelReply={handleCancelReply}
                isReplying={!!replyingTo}
                replyingTo={replyingTo}
              />
            ))}
            
            {(comments?.length || 0) === 0 && (
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