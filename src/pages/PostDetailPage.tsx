import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Heart, Share2, Pin, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { usePostDetails } from '@/hooks/usePostDetails';
import { PostContent } from '@/components/posts/PostContent';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const PostDetailPage = () => {
  const { postId, spaceId } = useParams<{ postId: string; spaceId: string }>();
  const navigate = useNavigate();
  const { data: post, isLoading, error } = usePostDetails(postId!, spaceId!);

  if (!postId || !spaceId) {
    navigate('/dashboard');
    return null;
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !post) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Post não encontrado ou você não tem permissão para visualizá-lo.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/dashboard')}
              >
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const authorName = post.profiles 
    ? `${post.profiles.first_name} ${post.profiles.last_name}`.trim()
    : 'Usuário';

  const getPostTypeIcon = () => {
    if (post.is_pinned) return <Pin className="h-4 w-4" />;
    if (post.is_announcement) return <Megaphone className="h-4 w-4" />;
    return null;
  };

  const getPostTypeBadge = () => {
    if (post.is_pinned) return <Badge variant="secondary">Fixado</Badge>;
    if (post.is_announcement) return <Badge variant="default">Anúncio</Badge>;
    return null;
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/dashboard/space/${spaceId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para {post.spaces?.name || 'Espaço'}
          </Button>
        </div>

        {/* Post Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.profiles?.avatar_url} />
                  <AvatarFallback>
                    {authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{authorName}</h3>
                    {getPostTypeBadge()}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{format(new Date(post.created_at), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    {post.spaces && (
                      <>
                        <span>•</span>
                        <span>{post.spaces.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {getPostTypeIcon()}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {post.title && (
              <h1 className="text-xl font-bold">{post.title}</h1>
            )}
            <PostContent content={post.content} />
            
            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => toast.info('Funcionalidade em desenvolvimento')}
              >
                <Heart className="h-4 w-4" />
                Curtir
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => toast.info('Funcionalidade em desenvolvimento')}
              >
                <MessageCircle className="h-4 w-4" />
                Comentar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Link copiado para a área de transferência');
                }}
              >
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PostDetailPage;