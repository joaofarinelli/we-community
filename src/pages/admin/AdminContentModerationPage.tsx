import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PostContent } from '@/components/posts/PostContent';
import { PostModerationActions } from '@/components/admin/PostModerationActions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useCompanyContext } from '@/hooks/useCompanyContext';

interface ModerationPost {
  id: string;
  title?: string;
  content: string;
  type: string;
  is_hidden: boolean;
  hidden_by?: string;
  hidden_at?: string;
  hidden_reason?: string;
  created_at: string;
  author_id: string;
  space_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
  spaces?: {
    name: string;
  };
}

const useAllPostsForModeration = () => {
  const { currentCompanyId } = useCompanyContext();

  return useQuery({
    queryKey: ['admin-moderation-posts', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return [];

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          type,
          is_hidden,
          hidden_by,
          hidden_at,
          hidden_reason,
          created_at,
          author_id,
          space_id,
          profiles!posts_author_profile_fkey(first_name, last_name),
          spaces(name)
        `)
        .eq('company_id', currentCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ModerationPost[];
    },
    enabled: !!currentCompanyId,
  });
};

export const AdminContentModerationPage = () => {
  const { data: posts = [], isLoading } = useAllPostsForModeration();
  const [activeTab, setActiveTab] = useState('all');

  const visiblePosts = posts.filter(post => !post.is_hidden);
  const hiddenPosts = posts.filter(post => post.is_hidden);

  const getPostsToShow = () => {
    switch (activeTab) {
      case 'visible':
        return visiblePosts;
      case 'hidden':
        return hiddenPosts;
      default:
        return posts;
    }
  };

  const renderPost = (post: ModerationPost) => (
    <Card key={post.id} className={`mb-4 ${post.is_hidden ? 'border-red-200 bg-red-50/50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {post.profiles?.first_name?.[0]}{post.profiles?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium truncate">
                  {post.profiles?.first_name} {post.profiles?.last_name}
                </p>
                <Badge variant="outline" className="text-xs">
                  {post.spaces?.name}
                </Badge>
                {post.is_hidden && (
                  <Badge variant="destructive" className="text-xs">
                    <EyeOff className="h-3 w-3 mr-1" />
                    Oculta
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </p>
            </div>
          </div>
          <PostModerationActions 
            postId={post.id}
            isHidden={post.is_hidden}
            hiddenReason={post.hidden_reason}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {post.title && (
          <h3 className="font-medium text-sm mb-2">{post.title}</h3>
        )}
        <PostContent content={post.content} />
        
        {post.is_hidden && post.hidden_reason && (
          <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">Motivo da ocultação:</p>
                <p className="text-sm text-red-700">{post.hidden_reason}</p>
                {post.hidden_at && (
                  <p className="text-xs text-red-600 mt-1">
                    Oculta em {formatDistanceToNow(new Date(post.hidden_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Moderação de Conteúdo</h1>
            <p className="text-muted-foreground">
              Gerencie e modere postagens da sua comunidade
            </p>
          </div>
          <div className="text-center py-8">Carregando...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Moderação de Conteúdo</h1>
          <p className="text-muted-foreground">
            Gerencie e modere postagens da sua comunidade
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Postagens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{posts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                Visíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{visiblePosts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <EyeOff className="h-4 w-4 mr-2" />
                Ocultas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{hiddenPosts.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todas ({posts.length})</TabsTrigger>
            <TabsTrigger value="visible">Visíveis ({visiblePosts.length})</TabsTrigger>
            <TabsTrigger value="hidden">Ocultas ({hiddenPosts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="space-y-4">
              {posts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">Nenhuma postagem encontrada.</p>
                  </CardContent>
                </Card>
              ) : (
                getPostsToShow().map(renderPost)
              )}
            </div>
          </TabsContent>

          <TabsContent value="visible" className="mt-6">
            <div className="space-y-4">
              {visiblePosts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">Nenhuma postagem visível encontrada.</p>
                  </CardContent>
                </Card>
              ) : (
                visiblePosts.map(renderPost)
              )}
            </div>
          </TabsContent>

          <TabsContent value="hidden" className="mt-6">
            <div className="space-y-4">
              {hiddenPosts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">Nenhuma postagem oculta encontrada.</p>
                  </CardContent>
                </Card>
              ) : (
                hiddenPosts.map(renderPost)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};