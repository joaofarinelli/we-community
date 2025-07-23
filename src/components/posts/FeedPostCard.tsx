import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pin, MessageCircle, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PostInteractions } from './PostInteractions';
import { PostContent } from './PostContent';
import { getSpaceTypeInfo } from '@/lib/spaceUtils';

interface FeedPost {
  id: string;
  title?: string;
  content: string;
  type: string;
  is_pinned: boolean;
  is_announcement: boolean;
  created_at: string;
  author_id: string;
  space_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
  spaces?: {
    name: string;
    type: string;
  };
  post_interactions?: Array<{ id: string }>;
}

interface FeedPostCardProps {
  post: FeedPost;
}

export const FeedPostCard = ({ post }: FeedPostCardProps) => {
  const navigate = useNavigate();
  
  const authorName = post.profiles 
    ? `${post.profiles.first_name} ${post.profiles.last_name}`
    : 'Usuário';

  const authorInitials = post.profiles
    ? `${post.profiles.first_name[0]}${post.profiles.last_name[0]}`
    : 'U';

  const spaceName = post.spaces?.name || 'Espaço';
  const spaceType = post.spaces?.type || 'text';
  const spaceTypeInfo = getSpaceTypeInfo(spaceType as any);
  const SpaceIcon = spaceTypeInfo.icon;

  const handleSpaceClick = () => {
    navigate(`/dashboard/space/${post.space_id}`);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Header do Post */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-foreground">{authorName}</h4>
                {post.is_pinned && (
                  <Pin className="h-4 w-4 text-primary" />
                )}
                {post.is_announcement && (
                  <Badge variant="secondary" className="text-xs">
                    Anúncio
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
                <span>•</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-muted-foreground hover:text-primary"
                  onClick={handleSpaceClick}
                >
                  <div className="flex items-center gap-1">
                    <SpaceIcon className="h-3 w-3" />
                    <span>{spaceName}</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo do Post */}
        <div className="mb-4">
          {post.title && (
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              {post.title}
            </h3>
          )}
          <PostContent content={post.content} />
        </div>

        {/* Interações */}
        <PostInteractions postId={post.id} />
      </CardContent>
    </Card>
  );
};