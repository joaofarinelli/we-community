import { TrendingUp, Heart, MessageCircle, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { usePopularPosts } from '@/hooks/usePopularPosts';

export const PopularPostsCard = () => {
  const navigate = useNavigate();
  const { data: posts, isLoading } = usePopularPosts(5);

  const truncateContent = (content: string, maxLength: number = 40) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const handlePostClick = (post: any) => {
    navigate(`/dashboard/space/${post.space_id}/post/${post.id}`);
  };

  if (isLoading) {
    return (
      <Card className="sticky top-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Posts populares
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-2">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-3">
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!posts.length) {
    return (
      <Card className="sticky top-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Posts populares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">
            Nenhum post popular encontrado
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Posts populares
        </CardTitle>
      </CardHeader>
        <CardContent className="space-y-3">
        {posts.map((post) => {
          const likesCount = post.post_interactions?.filter((i: any) => i.type === 'like').length || 0;
          const commentsCount = post.post_interactions?.filter((i: any) => i.type === 'comment').length || 0;
          const authorName = post.profiles ? `${post.profiles.first_name} ${post.profiles.last_name}` : 'Usuário';
          
          return (
            <div
              key={post.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
              onClick={() => handlePostClick(post)}
            >
              <div className="h-8 w-8 bg-primary rounded flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                  {post.title || truncateContent(post.content)}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {authorName}
                </p>
                
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Heart className="h-3 w-3" />
                    {likesCount}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircle className="h-3 w-3" />
                    {commentsCount}
                  </div>
                </div>
              </div>
              
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};