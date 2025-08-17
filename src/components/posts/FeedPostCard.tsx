import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pin, MessageCircle, MapPin, MoreHorizontal, Edit, Trash2, EyeOff, Eye } from 'lucide-react';
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
import { useIsAdmin } from '@/hooks/useUserRole';
import { useUpdatePost } from '@/hooks/useUpdatePost';
import { UserTagsDisplay } from './UserTagsDisplay';
import { OtherUserProfileDialog } from '@/components/dashboard/OtherUserProfileDialog';
import { HidePostDialog } from './HidePostDialog';

interface FeedPost {
  id: string;
  title?: string;
  content: string;
  type: string;
  is_pinned: boolean;
  is_announcement: boolean;
  hide_author?: boolean;
  is_hidden?: boolean;
  hidden_by?: string;
  hidden_at?: string;
  hidden_reason?: string;
  created_at: string;
  updated_at?: string;
  author_id: string;
  space_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
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
  const isAdmin = useIsAdmin();
  const updatePost = useUpdatePost();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showHideDialog, setShowHideDialog] = useState(false);

  const handleToggleAuthorVisibility = async () => {
    try {
      await updatePost.mutateAsync({
        postId: post.id,
        data: { hide_author: !post.hide_author }
      });
    } catch (error) {
      console.error('Error toggling author visibility:', error);
    }
  };
  
  const authorName = post.hide_author 
    ? 'Autor Oculto'
    : post.profiles 
      ? `${post.profiles.first_name} ${post.profiles.last_name}`
      : 'Usuário';

  const authorInitials = post.hide_author
    ? 'AO'
    : post.profiles
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
    // Don't allow clicking on hidden authors
    if (post.hide_author) return;
    
    console.log('Feed user clicked:', post.author_id, 'Current user:', user?.id);
    if (post.author_id !== user?.id) {
      console.log('Opening feed user profile dialog');
      setShowUserProfile(true);
    } else {
      console.log('User clicked on their own profile in feed');
    }
  };

  // Show menu for post author or admin
  const isAuthor = user?.id === post.author_id;
  const canEditDelete = isAuthor || isAdmin;

  return (
    <Card className="w-full">
      <CardContent className="p-3 sm:p-4 md:p-6">
        {/* Header do Post */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-start space-x-2 sm:space-x-3 min-w-0 flex-1">
            {!post.hide_author && (
              <Avatar 
                className="h-8 w-8 sm:h-10 sm:w-10 transition-all flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50"
                onClick={handleUserClick}
              >
                <AvatarImage src={post.profiles?.avatar_url || ''} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs sm:text-sm">
                  {authorInitials}
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 sm:flex-wrap">
                <h4 className="font-medium text-foreground text-sm sm:text-base truncate">
                  {post.hide_author ? (post.title || 'Post sem título') : authorName}
                </h4>
                <div className="hidden sm:flex items-center space-x-2">
                  {!post.hide_author && (
                    <UserTagsDisplay userId={post.author_id} maxTags={2} size="sm" />
                  )}
                  {post.is_pinned && (
                    <Pin className="h-4 w-4 text-primary" />
                  )}
                  {post.is_announcement && (
                    <Badge variant="secondary" className="text-xs">
                      Anúncio
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Mobile badges */}
              <div className="sm:hidden flex items-center space-x-2 mt-1">
                {!post.hide_author && (
                  <UserTagsDisplay userId={post.author_id} maxTags={1} size="sm" />
                )}
                {post.is_pinned && (
                  <Pin className="h-3 w-3 text-primary" />
                )}
                {post.is_announcement && (
                  <Badge variant="secondary" className="text-xs">
                    Anúncio
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-0">
                <span>
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
                <span className="hidden sm:inline">•</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-muted-foreground hover:text-primary justify-start"
                  onClick={handleSpaceClick}
                >
                  <div className="flex items-center gap-1">
                    <SpaceIcon className="h-3 w-3" />
                    <span className="truncate max-w-32 sm:max-w-none">{spaceName}</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Menu de Ações - for author or admin */}
          {canEditDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-8 sm:w-8 p-0 flex-shrink-0">
                  <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                {isAuthor && (
                  <DropdownMenuItem onClick={() => setShowHideDialog(true)}>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Ocultar Post
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem onClick={handleToggleAuthorVisibility}>
                    {post.hide_author ? (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Mostrar Autor
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Ocultar Autor
                      </>
                    )}
                  </DropdownMenuItem>
                )}
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
        <div className="mb-3 sm:mb-4">
          {post.title && !post.hide_author && (
            <h3 className="text-base sm:text-lg font-semibold mb-2 text-foreground">
              {post.title}
            </h3>
          )}
          <PostContent 
            content={post.content} 
            key={`${post.id}-${post.updated_at || post.created_at}`}
          />
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

        <HidePostDialog
          open={showHideDialog}
          onOpenChange={setShowHideDialog}
          postId={post.id}
          postTitle={post.title}
        />
      </CardContent>
    </Card>
  );
};