import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, Heart, Share2, Pin } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePostInteractions } from '@/hooks/usePostInteractions';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface PostCardViewProps {
  post: any;
}

export const PostCardView = ({ post }: PostCardViewProps) => {
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
  const truncatedContent = textContent.length > 80 
    ? textContent.substring(0, 80) + '...' 
    : textContent;

  // Extract first image from content if exists
  const getFirstImage = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    const img = div.querySelector('img');
    return img?.src;
  };

  const firstImage = getFirstImage(post.content);

  const handlePostClick = () => {
    navigate(`/post/${post.id}`);
  };

  return (
    <Card className="h-full hover:shadow-md transition-all cursor-pointer group" onClick={handlePostClick}>
      {/* Image preview if exists */}
      {firstImage && (
        <div className="aspect-video overflow-hidden rounded-t-lg">
          <img 
            src={firstImage} 
            alt="Post preview" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">{authorInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{authorName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </p>
          </div>
          {post.is_pinned && (
            <Badge variant="secondary" className="h-4 px-1">
              <Pin className="h-2 w-2" />
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-foreground/80 line-clamp-3 mb-3">
          {truncatedContent}
        </p>

        {/* Interactions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              <span>{likes?.length || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              <span>{comments?.length || 0}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleLike();
              }}
              disabled={isLoading}
              className={`h-6 w-6 p-0 ${userLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground'}`}
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
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
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
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <Share2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};