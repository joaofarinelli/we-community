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
      {/* Banner - sem padding para ocupar largura total */}
      <PageBanner bannerType="spaces" />
      
      <div className="p-6 w-full max-w-full overflow-hidden space-y-3 sm:space-y-4 md:space-y-6">
        {/* Header */}
        <div className="px-1 sm:px-0">
          <div className="text-center sm:text-left space-y-1 sm:space-y-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold break-words">
              Espaços
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground break-words">
              Todos os espaços que você participa
            </p>
          </div>
        </div>

        {/* Category Filter Tabs */}
        {categories && categories.length > 0 && (
          <div className="w-full">
            <Tabs value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <div className="w-full overflow-x-auto pb-1">
                <TabsList className="w-full sm:w-auto flex justify-start min-w-max">
                  <TabsTrigger 
                    value="all" 
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 whitespace-nowrap"
                  >
                    <span className="truncate">Todos</span>
                    <span className="ml-1 text-xs">({spaces?.length || 0})</span>
                  </TabsTrigger>
                  {categories.map((category) => (
                    <TabsTrigger 
                      key={category.id} 
                      value={category.id} 
                      className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 whitespace-nowrap max-w-[120px] sm:max-w-none"
                    >
                      <Folder className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      <span className="truncate max-w-[60px] sm:max-w-[80px] md:max-w-none">
                        {category.name}
                      </span>
                      <span className="ml-1 text-xs flex-shrink-0">
                        ({spacesByCategory[category.id]?.length || 0})
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          </div>
        )}

        {/* Spaces Grid */}
        <div className="w-full">
          {filteredSpaces.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 auto-rows-fr">
              {filteredSpaces.map((space) => (
                <div key={space.id} className="w-full h-full">
                  <SpaceCard 
                    space={space}
                    onClick={() => navigate(`/dashboard/space/${space.id}`)}
                    showJoinLeave={true}
                    className="h-full min-h-[200px] flex flex-col"
                  />
                </div>
              ))}
            </div>
          ) : (
            <Card className="w-full">
              <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6">
                <div className="text-center space-y-3 sm:space-y-4 max-w-md mx-auto">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Folder className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <h3 className="text-sm sm:text-base md:text-lg font-medium break-words">
                      {selectedCategoryId === 'all' 
                        ? 'Nenhum espaço encontrado' 
                        : 'Nenhum espaço nesta categoria'
                      }
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground break-words leading-relaxed">
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
        </div>

        {/* Statistics */}
        {spaces && spaces.length > 0 && (
          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              <Card className="w-full">
                <CardHeader className="pb-2 p-3 sm:p-4 lg:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                    Total de Espaços
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
                    {spaces.length}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {spaces.length === 1 ? 'espaço' : 'espaços'}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="w-full">
                <CardHeader className="pb-2 p-3 sm:p-4 lg:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                    Espaços Públicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
                    {spaces.filter(space => space.visibility === 'public').length}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    públicos
                  </p>
                </CardContent>
              </Card>
              
              <Card className="w-full sm:col-span-2 lg:col-span-1">
                <CardHeader className="pb-2 p-3 sm:p-4 lg:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                    Espaços Privados
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
                    {spaces.filter(space => space.visibility === 'private').length}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    privados
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};