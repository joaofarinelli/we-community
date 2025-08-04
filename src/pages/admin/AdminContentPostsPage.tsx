import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AdminContentPostsPage = () => {
  const { currentCompanyId } = useCompanyContext();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['admin-posts', currentCompanyId],
    queryFn: async () => {
      if (!currentCompanyId) return [];
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey (first_name, last_name),
          space:spaces!posts_space_id_fkey (name)
        `)
        .eq('company_id', currentCompanyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentCompanyId,
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

  // Como a tabela posts não tem campos is_draft ou scheduled_for, vamos usar apenas o que existe
  const allPosts = posts || [];
  const publishedPosts = allPosts; // Considerando todos como publicados por enquanto
  const draftPosts: any[] = []; // Array vazio pois não temos esse campo
  const scheduledPosts: any[] = []; // Array vazio pois não temos esse campo

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Publicações</h1>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova publicação
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="all" className="flex items-center gap-2">
              Todas
              <Badge variant="secondary" className="ml-1">
                {posts?.length || 0}
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
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : posts?.length === 0 ? (
              <div className="border rounded-lg p-16 text-center">
                <h2 className="text-xl font-semibold mb-2">Crie sua primeira publicação</h2>
                <p className="text-muted-foreground mb-6">
                  Comece sua comunidade criando a primeira publicação.
                </p>
                <Button>
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
                    {posts.map((post) => (
                      <tr key={post.id} className="border-b hover:bg-muted/25">
                        <td className="p-4 font-medium">{post.title || 'Post sem título'}</td>
                        <td className="p-4">
                          {Array.isArray(post.author) && post.author.length > 0 
                            ? `${post.author[0].first_name} ${post.author[0].last_name}`
                            : 'N/A'
                          }
                        </td>
                        <td className="p-4">{post.space?.name || 'N/A'}</td>
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
      </div>
    </AdminLayout>
  );
};