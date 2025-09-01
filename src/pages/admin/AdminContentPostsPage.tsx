import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { CreatePostDialog } from '@/components/posts/CreatePostDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AdminContentPostsPage = () => {
  const { currentCompanyId } = useCompanyContext();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: posts, isLoading } = useQuery({
    queryKey: ['admin-posts', currentCompanyId, searchTerm, selectedFilters],
    queryFn: async () => {
      if (!currentCompanyId) return [];
      
      let query = supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          created_at,
          author_id,
          space_id
        `)
        .eq('company_id', currentCompanyId)
        .order('created_at', { ascending: false });

      // Apply search filter
      if (searchTerm.trim()) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.limit(100);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentCompanyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Separate queries for author and space data to load faster
  const { data: authorsData } = useQuery({
    queryKey: ['admin-posts-authors', currentCompanyId, posts?.map(p => p.author_id)],
    queryFn: async () => {
      if (!posts?.length) return {};
      
      const authorIds = [...new Set(posts.map(p => p.author_id))];
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', authorIds);
      
      if (error) throw error;
      return data?.reduce((acc, author) => {
        acc[author.user_id] = author;
        return acc;
      }, {} as Record<string, any>) || {};
    },
    enabled: !!posts?.length,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const { data: spacesData } = useQuery({
    queryKey: ['admin-posts-spaces', currentCompanyId, posts?.map(p => p.space_id)],
    queryFn: async () => {
      if (!posts?.length) return {};
      
      const spaceIds = [...new Set(posts.map(p => p.space_id))];
      const { data, error } = await supabase
        .from('spaces')
        .select('id, name')
        .in('id', spaceIds);
      
      if (error) throw error;
      return data?.reduce((acc, space) => {
        acc[space.id] = space;
        return acc;
      }, {} as Record<string, any>) || {};
    },
    enabled: !!posts?.length,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const filters = [
    { id: 'title', label: 'Título' },
    { id: 'author', label: 'Autor' },
    { id: 'space', label: 'Acesso ao Espaço' },
    { id: 'topics', label: 'Tópicos' },
    { id: 'published', label: 'Publicada' },
  ];

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  // Filter posts based on selected filters and data
  const filteredPosts = (posts || []).filter(post => {
    if (selectedFilters.length === 0) return true;
    
    return selectedFilters.every(filterId => {
      switch (filterId) {
        case 'title':
          return post.title && post.title.trim().length > 0;
        case 'author':
          return authorsData?.[post.author_id];
        case 'space':
          return spacesData?.[post.space_id];
        case 'published':
          return true; // All posts are published
        case 'topics':
          return post.content && post.content.includes('#');
        default:
          return true;
      }
    });
  });

  // Como a tabela posts não tem campos is_draft ou scheduled_for, vamos usar apenas o que existe
  const allPosts = filteredPosts;
  const publishedPosts = filteredPosts;
  const draftPosts: any[] = []; // Array vazio pois não temos esse campo
  const scheduledPosts: any[] = []; // Array vazio pois não temos esse campo

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Publicações</h1>
          <Button onClick={() => setCreatePostOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova publicação
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar publicações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="all" className="flex items-center gap-2">
              Todas
              <Badge variant="secondary" className="ml-1">
                {filteredPosts.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="drafts" className="flex items-center gap-2">
              Rascunhos
              <Badge variant="secondary" className="ml-1">
                {draftPosts.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              Agendadas
              <Badge variant="secondary" className="ml-1">
                {scheduledPosts.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap gap-2 mt-4">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                variant={selectedFilters.includes(filter.id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFilter(filter.id)}
                className="text-sm"
              >
                <Plus className="h-3 w-3 mr-1" />
                {filter.label}
              </Button>
            ))}
          </div>

          <TabsContent value="all" className="mt-6">
            {isLoading ? (
              <TableSkeleton rows={8} columns={6} />
            ) : filteredPosts.length === 0 ? (
              <div className="border rounded-lg p-16 text-center">
                <h2 className="text-xl font-semibold mb-2">{searchTerm || selectedFilters.length > 0 ? 'Nenhuma publicação encontrada' : 'Crie sua primeira publicação'}</h2>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || selectedFilters.length > 0 
                    ? 'Tente ajustar seus filtros ou termos de busca.'
                    : 'Comece sua comunidade criando a primeira publicação.'
                  }
                </p>
                <Button onClick={() => setCreatePostOpen(true)}>
                  Criar publicação
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Título</th>
                      <th className="text-left p-4 font-medium">Autor</th>
                      <th className="text-left p-4 font-medium">Espaço</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Data</th>
                      <th className="text-left p-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.map((post) => (
                      <tr key={post.id} className="border-b hover:bg-muted/25">
                        <td className="p-4 font-medium">{post.title || 'Post sem título'}</td>
                        <td className="p-4">
                          {authorsData?.[post.author_id] 
                            ? `${authorsData[post.author_id].first_name} ${authorsData[post.author_id].last_name}`
                            : 'Carregando...'
                          }
                        </td>
                        <td className="p-4">{spacesData?.[post.space_id]?.name || 'Carregando...'}</td>
                        <td className="p-4">
                          <Badge variant="default">
                            Publicado
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {format(new Date(post.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm">
                            Editar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="drafts" className="mt-6">
            {draftPosts.length === 0 ? (
              <div className="border rounded-lg p-16 text-center">
                <h2 className="text-xl font-semibold mb-2">Nenhum rascunho encontrado</h2>
                <p className="text-muted-foreground">
                  Você não possui publicações em rascunho.
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Título</th>
                      <th className="text-left p-4 font-medium">Autor</th>
                      <th className="text-left p-4 font-medium">Espaço</th>
                      <th className="text-left p-4 font-medium">Data</th>
                      <th className="text-left p-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draftPosts.map((post) => (
                      <tr key={post.id} className="border-b hover:bg-muted/25">
                        <td className="p-4 font-medium">{post.title || 'Post sem título'}</td>
                        <td className="p-4">
                          {Array.isArray(post.author) && post.author.length > 0 
                            ? `${post.author[0].first_name} ${post.author[0].last_name}`
                            : 'N/A'
                          }
                        </td>
                        <td className="p-4">{post.space?.name || 'N/A'}</td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {format(new Date(post.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm">
                            Editar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="mt-6">
            {scheduledPosts.length === 0 ? (
              <div className="border rounded-lg p-16 text-center">
                <h2 className="text-xl font-semibold mb-2">Nenhuma publicação agendada</h2>
                <p className="text-muted-foreground">
                  Você não possui publicações agendadas.
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Título</th>
                      <th className="text-left p-4 font-medium">Autor</th>
                      <th className="text-left p-4 font-medium">Espaço</th>
                      <th className="text-left p-4 font-medium">Agendado para</th>
                      <th className="text-left p-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledPosts.map((post) => (
                      <tr key={post.id} className="border-b hover:bg-muted/25">
                        <td className="p-4 font-medium">{post.title || 'Post sem título'}</td>
                        <td className="p-4">
                          {Array.isArray(post.author) && post.author.length > 0 
                            ? `${post.author[0].first_name} ${post.author[0].last_name}`
                            : 'N/A'
                          }
                        </td>
                        <td className="p-4">{post.space?.name || 'N/A'}</td>
                        <td className="p-4 text-sm text-muted-foreground">
                          -
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm">
                            Editar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <CreatePostDialog
          open={createPostOpen}
          onOpenChange={setCreatePostOpen}
        />
      </div>
    </AdminLayout>
  );
};