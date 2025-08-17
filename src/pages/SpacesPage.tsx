import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserMemberSpaces } from '@/hooks/useUserMemberSpaces';
import { useAvailableSpaces } from '@/hooks/useAvailableSpaces';
import { useSpaceCategories } from '@/hooks/useSpaceCategories';
import { SpaceCard } from '@/components/spaces/SpaceCard';
import { Loader2, Folder, Plus, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageBanner } from '@/components/ui/page-banner';

export const SpacesPage = () => {
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'my-spaces' | 'explore'>('my-spaces');
  
  const { data: categories, isLoading: categoriesLoading } = useSpaceCategories();
  const { data: mySpaces, isLoading: mySpacesLoading } = useUserMemberSpaces();
  const { data: availableSpaces, isLoading: availableSpacesLoading } = useAvailableSpaces();

  const isLoading = categoriesLoading || mySpacesLoading || availableSpacesLoading;

  // Get the current spaces based on active tab
  const currentSpaces = activeTab === 'my-spaces' ? mySpaces : availableSpaces;

  // Group spaces by category
  const spacesByCategory = currentSpaces?.reduce((acc, space) => {
    const categoryId = space.category_id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(space);
    return acc;
  }, {} as Record<string, typeof currentSpaces>) || {};

  // Filter spaces based on selected category
  const filteredSpaces = selectedCategoryId === 'all' 
    ? currentSpaces || []
    : spacesByCategory[selectedCategoryId] || [];

  // For explore tab, separate member and non-member spaces
  const memberSpaces = activeTab === 'explore' 
    ? filteredSpaces.filter(space => (space as any).isMember)
    : [];
  const nonMemberSpaces = activeTab === 'explore' 
    ? filteredSpaces.filter(space => !(space as any).isMember && space.visibility === 'public')
    : [];

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
              {activeTab === 'my-spaces' 
                ? 'Todos os espaços que você participa'
                : 'Explore e entre em novos espaços'
              }
            </p>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="w-full">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'my-spaces' | 'explore')}>
            <div className="w-full overflow-x-auto pb-1">
              <TabsList className="w-full sm:w-auto flex justify-start min-w-max">
                <TabsTrigger 
                  value="my-spaces" 
                  className="text-xs sm:text-sm px-3 sm:px-4 py-2 whitespace-nowrap"
                >
                  <Users className="h-4 w-4 mr-2" />
                  <span>Meus Espaços</span>
                  <span className="ml-2 text-xs">({mySpaces?.length || 0})</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="explore" 
                  className="text-xs sm:text-sm px-3 sm:px-4 py-2 whitespace-nowrap"
                >
                  <Search className="h-4 w-4 mr-2" />
                  <span>Explorar</span>
                  <span className="ml-2 text-xs">({availableSpaces?.filter(s => !(s as any).isMember && s.visibility === 'public').length || 0})</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
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
                     <span className="ml-1 text-xs">({currentSpaces?.length || 0})</span>
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
          {activeTab === 'explore' ? (
            <div className="space-y-6">
              {/* Non-member spaces (available to join) */}
              {nonMemberSpaces.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Search className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Espaços Disponíveis</h2>
                    <Badge variant="secondary">{nonMemberSpaces.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 auto-rows-fr">
                    {nonMemberSpaces.map((space) => (
                      <div key={space.id} className="w-full h-full">
                        <SpaceCard 
                          space={space}
                          onClick={() => navigate(`/dashboard/space/${space.id}`)}
                          showJoinLeave={true}
                          className="h-full min-h-[200px] flex flex-col border-primary/20"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Member spaces (already joined) */}
              {memberSpaces.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold text-muted-foreground">Já Participo</h2>
                    <Badge variant="outline">{memberSpaces.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 auto-rows-fr">
                    {memberSpaces.map((space) => (
                      <div key={space.id} className="w-full h-full">
                        <SpaceCard 
                          space={space}
                          onClick={() => navigate(`/dashboard/space/${space.id}`)}
                          showJoinLeave={true}
                          className="h-full min-h-[200px] flex flex-col opacity-60"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state for explore */}
              {nonMemberSpaces.length === 0 && memberSpaces.length === 0 && (
                <Card className="w-full">
                  <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6">
                    <div className="text-center space-y-3 sm:space-y-4 max-w-md mx-auto">
                      <div className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <Search className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-muted-foreground" />
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <h3 className="text-sm sm:text-base md:text-lg font-medium break-words">
                          Nenhum espaço público disponível
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground break-words leading-relaxed">
                          Não há espaços públicos para explorar no momento. Aguarde novos espaços serem criados ou convites para espaços privados.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            /* My Spaces Grid */
            filteredSpaces.length > 0 ? (
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
                          ? 'Você ainda não participa de nenhum espaço. Vá para "Explorar" para encontrar espaços públicos disponíveis.'
                          : 'Não há espaços nesta categoria ainda.'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>

        {/* Statistics */}
        {currentSpaces && currentSpaces.length > 0 && (
          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              <Card className="w-full">
                <CardHeader className="pb-2 p-3 sm:p-4 lg:p-6">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                    {activeTab === 'my-spaces' ? 'Meus Espaços' : 'Espaços Disponíveis'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
                    {activeTab === 'my-spaces' 
                      ? currentSpaces.length 
                      : availableSpaces?.filter(s => !(s as any).isMember && s.visibility === 'public').length || 0
                    }
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {activeTab === 'my-spaces' 
                      ? (currentSpaces.length === 1 ? 'espaço' : 'espaços')
                      : 'para explorar'
                    }
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
                    {currentSpaces.filter(space => space.visibility === 'public').length}
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
                    {currentSpaces.filter(space => space.visibility === 'private').length}
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