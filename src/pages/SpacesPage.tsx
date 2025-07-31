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
import { PageBanner } from '@/components/ui/page-banner';

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
      <div className="space-y-4 sm:space-y-6">
        {/* Banner */}
        <PageBanner bannerType="spaces" />
        
        {/* Header */}
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold">Espaços</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Todos os espaços que você participa
          </p>
        </div>

        {/* Category Filter Tabs */}
        {categories && categories.length > 0 && (
          <Tabs value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <div className="w-full overflow-x-auto">
              <TabsList className="w-full sm:w-auto flex justify-start min-w-max sm:min-w-0">
                <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-3">
                  Todos ({spaces?.length || 0})
                </TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id} className="text-xs sm:text-sm px-2 sm:px-3">
                    <Folder className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="truncate max-w-20 sm:max-w-none">{category.name}</span>
                    <span className="ml-1">({spacesByCategory[category.id]?.length || 0})</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        )}

        {/* Spaces Grid */}
        {filteredSpaces.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {filteredSpaces.map((space) => (
            <SpaceCard 
                key={space.id} 
                space={space}
                onClick={() => navigate(`/dashboard/space/${space.id}`)}
                showJoinLeave={true}
                className="h-full"
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
              <div className="text-center space-y-3 sm:space-y-4">
                <div className="h-16 w-16 sm:h-24 sm:w-24 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Folder className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-medium">
                    {selectedCategoryId === 'all' 
                      ? 'Nenhum espaço encontrado' 
                      : 'Nenhum espaço nesta categoria'
                    }
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto px-2">
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <Card>
              <CardHeader className="pb-2 p-3 sm:p-4 md:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                <div className="text-lg sm:text-2xl font-bold">{spaces.length}</div>
                <p className="text-xs text-muted-foreground hidden sm:block">espaços</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2 p-3 sm:p-4 md:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Públicos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                <div className="text-lg sm:text-2xl font-bold">
                  {spaces.filter(space => space.visibility === 'public').length}
                </div>
                <p className="text-xs text-muted-foreground hidden sm:block">espaços</p>
              </CardContent>
            </Card>
            
            <Card className="col-span-2 md:col-span-1">
              <CardHeader className="pb-2 p-3 sm:p-4 md:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Privados
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                <div className="text-lg sm:text-2xl font-bold">
                  {spaces.filter(space => space.visibility === 'private').length}
                </div>
                <p className="text-xs text-muted-foreground hidden sm:block">espaços</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};