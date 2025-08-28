import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { MoreHorizontal, MessageCircle, Edit2, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { 
  useEventComments, 
  useCreateEventComment, 
  useUpdateEventComment, 
  useDeleteEventComment,
  type EventComment 
} from '@/hooks/useEventComments';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EventCommentsProps {
  eventId: string;
}

export const EventComments = ({ eventId }: EventCommentsProps) => {
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useEventComments(eventId);
  const createCommentMutation = useCreateEventComment();
  const updateCommentMutation = useUpdateEventComment();
  const deleteCommentMutation = useDeleteEventComment();

  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await createCommentMutation.mutateAsync({
      eventId,
      content: newComment.trim(),
    });

    setNewComment('');
  };

  const handleSubmitReply = async (parentCommentId: string) => {
    if (!replyContent.trim()) return;

    await createCommentMutation.mutateAsync({
      eventId,
      content: replyContent.trim(),
      parentCommentId,
    });

    setReplyContent('');
    setReplyTo(null);
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    await updateCommentMutation.mutateAsync({
      commentId,
      content: editContent.trim(),
      eventId,
    });

    setEditingComment(null);
    setEditContent('');
  };

  const handleDeleteComment = async (commentId: string) => {
    if (confirm('Tem certeza que deseja excluir este comentário?')) {
      await deleteCommentMutation.mutateAsync({
        commentId,
        eventId,
      });
    }
  };

  const startEditComment = (comment: EventComment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const CommentItem = ({ comment, isReply = false }: { comment: EventComment; isReply?: boolean }) => (
    <Card className={`${isReply ? 'ml-8 mt-2' : 'mt-4'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getInitials(comment.profiles?.first_name, comment.profiles?.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">
                  {comment.profiles?.first_name} {comment.profiles?.last_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </span>
              </div>
              
              {editingComment === comment.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Edite seu comentário..."
                    className="min-h-[60px]"
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleUpdateComment(comment.id)}
                      disabled={updateCommentMutation.isPending}
                    >
                      Salvar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setEditingComment(null);
                        setEditContent('');
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  {!isReply && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 p-0 h-auto text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setReplyTo(comment.id)}
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Responder
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
          
          {user?.id === comment.user_id && editingComment !== comment.id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => startEditComment(comment)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {replyTo === comment.id && (
          <div className="mt-3 ml-11 space-y-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Escreva sua resposta..."
              className="min-h-[60px]"
            />
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => handleSubmitReply(comment.id)}
                disabled={createCommentMutation.isPending}
              >
                Responder
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setReplyTo(null);
                  setReplyContent('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <div className="text-center py-4">Carregando comentários...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Comentários</h3>
      
      <form onSubmit={handleSubmitComment} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="comment">Adicionar comentário</Label>
          <Textarea
            id="comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escreva seu comentário sobre este evento..."
            className="min-h-[80px]"
          />
        </div>
        <Button 
          type="submit" 
          disabled={!newComment.trim() || createCommentMutation.isPending}
        >
          {createCommentMutation.isPending ? 'Enviando...' : 'Comentar'}
        </Button>
      </form>

      <div className="space-y-2">
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum comentário ainda. Seja o primeiro a comentar!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
};