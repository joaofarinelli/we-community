import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pin, MessageCircle, MoreHorizontal, Edit, Trash2, EyeOff, Eye } from 'lucide-react';
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
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useUserRole';
import { useUpdatePost } from '@/hooks/useUpdatePost';
import { UserTagsDisplay } from './UserTagsDisplay';
import { OtherUserProfileDialog } from '@/components/dashboard/OtherUserProfileDialog';
import { PostModerationActions } from '@/components/admin/PostModerationActions';

interface Post {
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
  author_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface PostCardProps {
  post: Post;
}

export const PostCard = ({ post }: PostCardProps) => {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const updatePost = useUpdatePost();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

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

  // Show menu for post author or admin
  const isAuthor = user?.id === post.author_id;
  const canEditDelete = isAuthor || isAdmin;

  const handleUserClick = () => {
    // Don't allow clicking on hidden authors
    if (post.hide_author) return;
    
    console.log('User clicked:', post.author_id, 'Current user:', user?.id);
    if (post.author_id !== user?.id) {
      console.log('Opening user profile dialog');
      setShowUserProfile(true);
    } else {
      console.log('User clicked on their own profile');
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Header do Post */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            {!post.hide_author && (
              <Avatar 
                className="h-10 w-10 transition-all cursor-pointer hover:ring-2 hover:ring-primary/50" 
                onClick={handleUserClick}
              >
                <AvatarImage src="" className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {authorInitials}
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 flex-wrap">
                <h4 className="font-medium text-foreground">
                  {post.hide_author ? (post.title || 'Post sem título') : authorName}
                </h4>
                {!post.hide_author && (
                  <>
                    <UserTagsDisplay userId={post.author_id} maxTags={2} size="sm" />
                    {post.is_pinned && (
                      <Pin className="h-4 w-4 text-primary" />
                    )}
                    {post.is_announcement && (
                      <Badge variant="secondary" className="text-xs">
                        Anúncio
                      </Badge>
                    )}
                  </>
                )}
                {post.hide_author && post.is_pinned && (
                  <Pin className="h-4 w-4 text-primary" />
                )}
                {post.hide_author && post.is_announcement && (
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
          
          {/* Menu de Ações - for author or admin */}
          <div className="flex items-center space-x-2">
            {/* Ações de moderação para admins */}
            <PostModerationActions 
              postId={post.id}
              isHidden={post.is_hidden || false}
              hiddenReason={post.hidden_reason}
            />
            
            {/* Menu principal para autor ou admin */}
            {canEditDelete && (isAuthor || isAdmin) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAuthor && (
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
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
                  {isAuthor && (
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Conteúdo do Post */}
        <div className="mb-4">
          {post.title && !post.hide_author && (
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