import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, Heart, Share2, MoreHorizontal, Pin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePostInteractions } from '@/hooks/usePostInteractions';
import { useAuth } from '@/hooks/useAuth';

import { useNavigate } from 'react-router-dom';

interface PostListViewProps {
  post: any;
}

export const PostListView = ({ post }: PostListViewProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    likes,
    comments,
    userLiked,
    addInteraction,
    removeInteraction,
    isLoading
  } = usePostInteractions(post.id);

  const handleToggleLike = async () => {
    if (userLiked) {
      removeInteraction.mutate('like');
    } else {
      addInteraction.mutate({ type: 'like' });
    }
  };

  const authorName = post.profiles?.first_name && post.profiles?.last_name 
    ? `${post.profiles.first_name} ${post.profiles.last_name}`
    : 'Usuário';

  const authorInitials = post.profiles?.first_name && post.profiles?.last_name
    ? `${post.profiles.first_name[0]}${post.profiles.last_name[0]}`
    : 'U';

  // Extract text content from HTML
  const getTextContent = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const textContent = getTextContent(post.content);
  const truncatedContent = textContent.length > 120 
    ? textContent.substring(0, 120) + '...' 
    : textContent;

  const handlePostClick = () => {
    navigate(`/dashboard/space/${post.space_id}/post/${post.id}`);
  };

  return (
    <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer" onClick={handlePostClick}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage 
            src={post.profiles?.avatar_url} 
            alt={authorName}
            className="object-cover"
          />
          <AvatarFallback className="text-xs">{authorInitials}</AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{authorName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
            {post.is_pinned && (
              <Badge variant="secondary" className="h-4 px-1 text-xs">
                <Pin className="h-3 w-3 mr-1" />
                Fixado
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-foreground/80 line-clamp-2 mb-2">
            {truncatedContent}
          </p>

          {/* Interactions */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              <span>{likes?.length || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              <span>{comments?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleLike();
            }}
            disabled={isLoading}
            className={`h-7 w-7 p-0 ${userLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Heart className={`h-3 w-3 ${userLiked ? 'fill-current' : ''}`} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handlePostClick();
            }}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // Share functionality
            }}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <Share2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};