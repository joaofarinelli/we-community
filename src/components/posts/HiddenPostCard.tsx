import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EyeOff, Eye, MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useUserRole';
import { useUnhidePost } from '@/hooks/useHidePost';
import { OtherUserProfileDialog } from '@/components/dashboard/OtherUserProfileDialog';

interface HiddenPost {
  id: string;
  title?: string;
  content: string;
  is_hidden: boolean;
  hidden_by?: string;
  hidden_at?: string;
  hidden_reason?: string;
  created_at: string;
  author_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

interface HiddenPostCardProps {
  post: HiddenPost;
}

export const HiddenPostCard = ({ post }: HiddenPostCardProps) => {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const unhidePost = useUnhidePost();
  const [showUserProfile, setShowUserProfile] = useState(false);

  const handleUnhide = async () => {
    try {
      await unhidePost.mutateAsync(post.id);
    } catch (error) {
      console.error('Error unhiding post:', error);
    }
  };

  const authorName = post.profiles 
    ? `${post.profiles.first_name} ${post.profiles.last_name}`
    : 'Usuário';

  const authorInitials = post.profiles
    ? `${post.profiles.first_name[0]}${post.profiles.last_name[0]}`
    : 'U';

  const handleUserClick = () => {
    if (post.author_id !== user?.id) {
      setShowUserProfile(true);
    }
  };

  const canUnhide = isAdmin || user?.id === post.author_id;

  return (
    <Card className="w-full opacity-60 border-dashed">
      <CardContent className="p-6">
        {/* Header do Post */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <Avatar 
              className="h-10 w-10 transition-all cursor-pointer hover:ring-2 hover:ring-primary/50" 
              onClick={handleUserClick}
            >
              <AvatarImage src={post.profiles?.avatar_url || ''} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 flex-wrap">
                <h4 className="font-medium text-foreground">
                  {authorName}
                </h4>
                <Badge variant="destructive" className="text-xs">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Post Ocultado
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
              {post.hidden_at && (
                <p className="text-xs text-muted-foreground">
                  Ocultado em {formatDistanceToNow(new Date(post.hidden_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              )}
            </div>
          </div>
          
          {/* Menu de Ações */}
          {canUnhide && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleUnhide}>
                  <Eye className="h-4 w-4 mr-2" />
                  Reexibir Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Conteúdo do Post (limitado) */}
        <div className="mb-4">
          {post.title && (
            <h3 className="text-lg font-semibold mb-2 text-foreground opacity-70">
              {post.title}
            </h3>
          )}
          <div className="text-sm text-muted-foreground opacity-70">
            <p className="line-clamp-2">
              {post.content.length > 100 
                ? `${post.content.substring(0, 100)}...` 
                : post.content
              }
            </p>
          </div>
          {post.hidden_reason && (
            <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive font-medium mb-1">
                Motivo:
              </p>
              <p className="text-sm text-destructive/90">
                {post.hidden_reason}
              </p>
            </div>
          )}
        </div>

        <OtherUserProfileDialog
          userId={post.author_id}
          open={showUserProfile}
          onOpenChange={setShowUserProfile}
        />
      </CardContent>
    </Card>
  );
};