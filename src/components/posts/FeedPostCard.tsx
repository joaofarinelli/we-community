import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pin, MessageCircle, MapPin, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { PostInteractions } from './PostInteractions';
import { PostContent } from './PostContent';
import { DeletePostDialog } from './DeletePostDialog';
import { EditPostDialog } from './EditPostDialog';
import { getSpaceTypeInfo } from '@/lib/spaceUtils';
import { useAuth } from '@/hooks/useAuth';
import { UserTagsDisplay } from './UserTagsDisplay';
import { OtherUserProfileDialog } from '@/components/dashboard/OtherUserProfileDialog';

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  
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

  const handleUserClick = () => {
    console.log('Feed user clicked:', post.author_id, 'Current user:', user?.id);
    if (post.author_id !== user?.id) {
      console.log('Opening feed user profile dialog');
      setShowUserProfile(true);
    } else {
      console.log('User clicked on their own profile in feed');
    }
  };

  // Only show menu for post author
  const isAuthor = user?.id === post.author_id;

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Header do Post */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <Avatar 
              className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all" 
              onClick={handleUserClick}
            >
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 flex-wrap">
                <h4 
                  className="font-medium text-foreground cursor-pointer hover:text-primary transition-colors" 
                  onClick={handleUserClick}
                >
                  {authorName}
                </h4>
                <UserTagsDisplay userId={post.author_id} maxTags={2} size="sm" />
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
          
          {/* Menu de Ações - only for author */}
          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
        
        {/* Dialogs */}
        <DeletePostDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          postId={post.id}
          postTitle={post.title}
        />
        
        <EditPostDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          postId={post.id}
          initialTitle={post.title}
          initialContent={post.content}
        />

        <OtherUserProfileDialog
          userId={post.author_id}
          open={showUserProfile}
          onOpenChange={setShowUserProfile}
        />
      </CardContent>
    </Card>
  );
};