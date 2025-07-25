import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserMemberSpaces } from '@/hooks/useUserMemberSpaces';
import { useSpaceCategories } from '@/hooks/useSpaceCategories';
import { SpaceCard } from '@/components/spaces/SpaceCard';
import { Loader2, Folder, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SpacesPage = () => {
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  
  const { data: categories, isLoading: categoriesLoading } = useSpaceCategories();
  const { data: spaces, isLoading: spacesLoading } = useUserMemberSpaces();

  const isLoading = categoriesLoading || spacesLoading;

  // Group spaces by category
  const spacesByCategory = spaces?.reduce((acc, space) => {
    const categoryId = space.category_id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(space);
    return acc;
  }, {} as Record<string, typeof spaces>) || {};

  // Filter spaces based on selected category
  const filteredSpaces = selectedCategoryId === 'all' 
    ? spaces || []
    : spacesByCategory[selectedCategoryId] || [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Espaços</h1>
            <p className="text-muted-foreground">
              Todos os espaços que você participa
            </p>
          </div>
        </div>

        {/* Category Filter Tabs */}
        {categories && categories.length > 0 && (
          <Tabs value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <TabsList className="w-auto">
              <TabsTrigger value="all">
                Todos ({spaces?.length || 0})
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>
                  <Folder className="h-4 w-4 mr-2" />
                  {category.name} ({spacesByCategory[category.id]?.length || 0})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Spaces Grid */}
        {filteredSpaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSpaces.map((space) => (
            <SpaceCard 
                key={space.id} 
                space={space}
                onClick={() => navigate(`/dashboard/space/${space.id}`)}
                showJoinLeave={true}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Folder className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">
                    {selectedCategoryId === 'all' 
                      ? 'Nenhum espaço encontrado' 
                      : 'Nenhum espaço nesta categoria'
                    }
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {selectedCategoryId === 'all'
                      ? 'Você ainda não participa de nenhum espaço. Entre em espaços públicos ou aguarde um convite para espaços privados.'
                      : 'Não há espaços nesta categoria ainda.'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        {spaces && spaces.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Espaços
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{spaces.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Espaços Públicos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {spaces.filter(space => space.visibility === 'public').length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Espaços Privados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {spaces.filter(space => space.visibility === 'private').length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};