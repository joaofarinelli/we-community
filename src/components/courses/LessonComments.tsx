import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MessageCircle, Reply, Edit2, Trash2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLessonComments, useCreateLessonComment, useUpdateLessonComment, useDeleteLessonComment, LessonComment } from '@/hooks/useLessonComments';
import { useAuth } from '@/hooks/useAuth';

interface LessonCommentsProps {
  lessonId: string;
}

interface CommentItemProps {
  comment: LessonComment;
  lessonId: string;
  onReply: (commentId: string) => void;
  replyingTo?: string;
  level?: number;
}

const CommentItem = ({ comment, lessonId, onReply, replyingTo, level = 0 }: CommentItemProps) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);

  const updateComment = useUpdateLessonComment();
  const deleteComment = useDeleteLessonComment();
  const createComment = useCreateLessonComment();

  const isAuthor = user?.id === comment.user_id;
  const canReply = level < 2; // Limit reply depth

  const handleSaveEdit = async () => {
    if (editContent.trim()) {
      await updateComment.mutateAsync({
        commentId: comment.id,
        content: editContent,
        lessonId
      });
      setIsEditing(false);
    }
  };

  const handleReply = async () => {
    if (replyContent.trim()) {
      await createComment.mutateAsync({
        lessonId,
        content: replyContent,
        parentCommentId: comment.id
      });
      setReplyContent('');
      setShowReplyForm(false);
    }
  };

  const handleDelete = async () => {
    await deleteComment.mutateAsync({
      commentId: comment.id,
      lessonId
    });
  };

  return (
    <div className={`${level > 0 ? 'ml-8 border-l border-border pl-4' : ''}`}>
      <div className="flex gap-3 mb-4">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {comment.author?.first_name?.[0]}{comment.author?.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {comment.author?.first_name} {comment.author?.last_name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={updateComment.isPending}>
                  Salvar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm whitespace-pre-wrap mb-2">{comment.content}</p>
              <div className="flex gap-2">
                {canReply && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="h-auto p-1 text-xs"
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Responder
                  </Button>
                )}
                {isAuthor && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(true)}
                      className="h-auto p-1 text-xs"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-auto p-1 text-xs text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir comentário</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </>
          )}
          
          {showReplyForm && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Escreva sua resposta..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleReply}
                  disabled={createComment.isPending || !replyContent.trim()}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Responder
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowReplyForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              lessonId={lessonId}
              onReply={onReply}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const LessonComments = ({ lessonId }: LessonCommentsProps) => {
  const [newComment, setNewComment] = useState('');
  const { data: comments, isLoading } = useLessonComments(lessonId);
  const createComment = useCreateLessonComment();

  const handleSubmitComment = async () => {
    if (newComment.trim()) {
      await createComment.mutateAsync({
        lessonId,
        content: newComment
      });
      setNewComment('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comentários
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New comment form */}
        <div className="space-y-3">
          <Textarea
            placeholder="Adicione um comentário sobre esta aula..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          <Button 
            onClick={handleSubmitComment}
            disabled={createComment.isPending || !newComment.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            Comentar
          </Button>
        </div>

        {/* Comments list */}
        {isLoading ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Carregando comentários...</p>
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                lessonId={lessonId}
                onReply={(commentId) => console.log('Reply to:', commentId)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              Seja o primeiro a comentar sobre esta aula
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};