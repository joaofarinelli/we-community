import { TrendingUp, Heart, MessageCircle, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface PopularPost {
  id: string;
  title: string;
  content: string;
  author: string;
  likes_count: number;
  comments_count: number;
  space_id: string;
}

export const PopularPostsCard = () => {
  const navigate = useNavigate();

  // Using mock data for now - structure ready for real data integration
  const posts: PopularPost[] = [
    {
      id: '1',
      title: 'EVENTO GRANJA VIANNA',
      content: 'Compartilhando detalhes sobre o evento...',
      author: 'Autor oculto',
      likes_count: 12,
      comments_count: 5,
      space_id: 'space1'
    },
    {
      id: '2',
      title: '🎉 NÃO PERCA O...',
      content: 'Anúncio importante sobre...',
      author: 'Autor oculto',
      likes_count: 8,
      comments_count: 3,
      space_id: 'space2'
    },
    {
      id: '3',
      title: '🎉 INAUGURAÇÃO...',
      content: 'Celebrando a inauguração...',
      author: 'Autor oculto',
      likes_count: 15,
      comments_count: 7,
      space_id: 'space3'
    },
    {
      id: '4',
      title: 'Assessoria e Consultoria...',
      content: 'Oferecemos serviços especializados...',
      author: 'Carina Santos',
      likes_count: 6,
      comments_count: 2,
      space_id: 'space4'
    },
    {
      id: '5',
      title: 'Scarpino Corretora de...',
      content: 'Novidades do mercado imobiliário...',
      author: 'Reginaldo Scarpino',
      likes_count: 4,
      comments_count: 1,
      space_id: 'space5'
    }
  ];

  const truncateContent = (content: string, maxLength: number = 40) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const handlePostClick = (post: PopularPost) => {
    navigate(`/dashboard/space/${post.space_id}/post/${post.id}`);
  };

  return (
    <Card className="sticky top-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Posts populares
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {posts.map((post) => (
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
                {post.author}
              </p>
              
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart className="h-3 w-3" />
                  {post.likes_count}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageCircle className="h-3 w-3" />
                  {post.comments_count}
                </div>
              </div>
            </div>
            
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};