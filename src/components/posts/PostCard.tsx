import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pin, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PostInteractions } from './PostInteractions';

interface Post {
  id: string;
  title?: string;
  content: string;
  type: string;
  is_pinned: boolean;
  is_announcement: boolean;
  created_at: string;
  author_id: string;
  author_profile?: {
    first_name: string;
    last_name: string;
  };
}

interface PostCardProps {
  post: Post;
}

export const PostCard = ({ post }: PostCardProps) => {
  const authorName = post.author_profile 
    ? `${post.author_profile.first_name} ${post.author_profile.last_name}`
    : 'Usuário';

  const authorInitials = post.author_profile
    ? `${post.author_profile.first_name[0]}${post.author_profile.last_name[0]}`
    : 'U';

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
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
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
          <div className="text-foreground whitespace-pre-wrap">
            {post.content}
          </div>
        </div>

        {/* Interações */}
        <PostInteractions postId={post.id} />
      </CardContent>
    </Card>
  );
};