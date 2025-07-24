import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pin, MessageCircle } from 'lucide-react';
import { UserPost } from '@/hooks/useUserPosts';
import { getSpaceTypeInfo } from '@/lib/spaceUtils';

interface UserPostItemProps {
  post: UserPost;
  onClick?: () => void;
}

export const UserPostItem = ({ post, onClick }: UserPostItemProps) => {
  const spaceName = post.spaces?.name || 'Espaço';
  const spaceType = post.spaces?.type || 'text';
  const spaceTypeInfo = getSpaceTypeInfo(spaceType as any);
  const SpaceIcon = spaceTypeInfo.icon;

  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Card 
      className="cursor-pointer hover:bg-muted/50 transition-colors" 
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          {/* Post Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SpaceIcon className="h-3 w-3" />
              <span>{spaceName}</span>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              {post.is_pinned && (
                <Pin className="h-3 w-3 text-primary" />
              )}
              {post.is_announcement && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  Anúncio
                </Badge>
              )}
            </div>
          </div>

          {/* Post Content */}
          <div>
            {post.title && (
              <h4 className="font-medium text-sm mb-1 line-clamp-1">
                {post.title}
              </h4>
            )}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {truncateContent(post.content)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};