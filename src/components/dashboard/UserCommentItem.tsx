import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { UserComment } from '@/hooks/useUserComments';
import { getSpaceTypeInfo } from '@/lib/spaceUtils';

interface UserCommentItemProps {
  comment: UserComment;
  onClick?: () => void;
}

export const UserCommentItem = ({ comment, onClick }: UserCommentItemProps) => {
  const spaceName = comment.posts?.spaces?.name || 'Espaço';
  const spaceType = comment.posts?.spaces?.type || 'text';
  const spaceTypeInfo = getSpaceTypeInfo(spaceType as any);
  const SpaceIcon = spaceTypeInfo.icon;
  const postTitle = comment.posts?.title;

  const truncateContent = (content: string, maxLength = 100) => {
    // Remove HTML tags and truncate
    const cleanContent = content.replace(/<[^>]*>/g, '');
    if (cleanContent.length <= maxLength) return cleanContent;
    return cleanContent.substring(0, maxLength) + '...';
  };

  return (
    <Card 
      className="cursor-pointer hover:bg-muted/50 transition-colors" 
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          {/* Comment Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>Comentário em</span>
              <SpaceIcon className="h-3 w-3" />
              <span>{spaceName}</span>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
          </div>

          {/* Comment Content */}
          <div>
            {postTitle && (
              <h4 className="font-medium text-sm mb-1 line-clamp-1 text-muted-foreground">
                Post: {postTitle}
              </h4>
            )}
            <p className="text-sm line-clamp-2">
              {truncateContent(comment.comment_text)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};