import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Reply, Send, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';

interface CommentItemProps {
  comment: {
    id: string;
    comment_text: string;
    created_at: string;
    user_id: string;
    parent_comment_id?: string;
    profiles?: {
      first_name: string;
      last_name: string;
    };
  };
  replies?: CommentItemProps['comment'][];
  onReply: (parentId: string, text: string) => void;
  onDeleteComment?: (commentId: string) => void;
  isReplying?: boolean;
  onStartReply?: (commentId: string) => void;
  onCancelReply?: () => void;
  replyingTo?: string;
  level?: number;
}

export const CommentItem = ({ 
  comment, 
  replies = [], 
  onReply,
  onDeleteComment,
  isReplying = false,
  onStartReply,
  onCancelReply,
  replyingTo,
  level = 0
}: CommentItemProps) => {
  const [replyText, setReplyText] = useState('');
  const { user } = useAuth();

  const authorName = comment.profiles 
    ? `${comment.profiles.first_name} ${comment.profiles.last_name}`
    : 'Usuário';

  const initials = authorName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase();

  const handleSubmitReply = () => {
    if (replyText.trim()) {
      onReply(comment.id, replyText);
      setReplyText('');
      onCancelReply?.();
    }
  };

  const maxLevel = 2; // Limitar a profundidade máxima

  return (
    <div className={`${level > 0 ? 'ml-6 border-l-2 border-muted pl-4' : ''}`}>
      <div className="flex space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{authorName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>
          
          <p className="text-sm">{comment.comment_text}</p>
          
          <div className="flex items-center space-x-3">
            {level < maxLevel && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onStartReply?.(comment.id)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Responder
              </Button>
            )}
            
            {user?.id === comment.user_id && onDeleteComment && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-red-500"
                onClick={() => onDeleteComment(comment.id)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Deletar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Formulário de resposta */}
      {isReplying && replyingTo === comment.id && (
        <div className="mt-3 ml-11 space-y-2">
          <div className="text-xs text-muted-foreground">
            Respondendo a {authorName}...
          </div>
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Escreva sua resposta..."
            className="min-h-[60px] text-sm"
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelReply}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitReply}
              disabled={!replyText.trim()}
            >
              <Send className="h-3 w-3 mr-1" />
              Responder
            </Button>
          </div>
        </div>
      )}

      {/* Respostas aninhadas */}
      {replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDeleteComment={onDeleteComment}
              onStartReply={onStartReply}
              onCancelReply={onCancelReply}
              isReplying={isReplying}
              replyingTo={replyingTo}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};