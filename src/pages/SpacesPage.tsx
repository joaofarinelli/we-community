import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserMemberSpaces } from '@/hooks/useUserMemberSpaces';
import { useAvailableSpaces } from '@/hooks/useAvailableSpaces';
import { useSpaceCategories } from '@/hooks/useSpaceCategories';
import { SpacesGrid } from '@/components/spaces/SpacesGrid';
import { Loader2, Search } from 'lucide-react';
import { PageBanner } from '@/components/ui/page-banner';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const SpacesPage = () => {
  const [activeTab, setActiveTab] = useState<'my-spaces' | 'explore'>('my-spaces');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: categories, isLoading: categoriesLoading } = useSpaceCategories();
  const { data: mySpaces, isLoading: mySpacesLoading } = useUserMemberSpaces();
  const { data: availableSpaces, isLoading: availableSpacesLoading } = useAvailableSpaces();

  const isLoading = categoriesLoading || mySpacesLoading || availableSpacesLoading;

  const currentSpaces = activeTab === 'my-spaces' ? mySpaces : availableSpaces;

  const { spacesByCategory, filteredCategories } = useMemo(() => {
    if (!currentSpaces || !categories) return { spacesByCategory: {}, filteredCategories: [] };

    const grouped = currentSpaces.reduce((acc, space) => {
      const categoryId = space.category_id || 'uncategorized';
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(space);
      return acc;
    }, {} as Record<string, typeof currentSpaces>);

    if (searchTerm) {
      Object.keys(grouped).forEach(categoryId => {
        grouped[categoryId] = grouped[categoryId].filter(space =>
          space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          space.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    const categoriesWithSpaces = categories.filter(category => 
      grouped[category.id] && grouped[category.id].length > 0
    );

    if (grouped['uncategorized'] && grouped['uncategorized'].length > 0) {
      categoriesWithSpaces.push({
        id: 'uncategorized',
        name: 'Sem Categoria',
        order_index: 999,
        company_id: '',
        created_at: '',
        updated_at: ''
      });
    }

    return { 
      spacesByCategory: grouped, 
      filteredCategories: categoriesWithSpaces 
    };
  }, [currentSpaces, categories, searchTerm]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div>
          <PageBanner bannerType="spaces" />
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-96 w-full" />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentSpaces || currentSpaces.length === 0) {
    return (
      <DashboardLayout>
        <div>
          <PageBanner bannerType="spaces" />
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {activeTab === 'my-spaces' ? 'Meus Espaços' : 'Explorar Espaços'}
            </h1>
            <p className="text-muted-foreground">
              {activeTab === 'my-spaces' 
                ? 'Você ainda não participa de nenhum espaço.'
                : 'Não há espaços disponíveis para explorar no momento.'
              }
            </p>
          </div>

          <div>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'my-spaces' | 'explore')}>
              <TabsList>
                <TabsTrigger value="my-spaces">Meus Espaços</TabsTrigger>
                <TabsTrigger value="explore">Explorar</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-muted-foreground">
              {activeTab === 'my-spaces' ? 'Nenhum espaço encontrado' : 'Nenhum espaço disponível'}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              {activeTab === 'my-spaces' 
                ? 'Entre em espaços através da aba "Explorar" ou aguarde convites.'
                : 'Novos espaços aparecerão aqui quando estiverem disponíveis.'
              }
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <PageBanner bannerType="spaces" />
      </div>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
            {activeTab === 'my-spaces' ? 'Meus Espaços' : 'Explorar Espaços'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {activeTab === 'my-spaces' 
              ? 'Acesse e gerencie todos os seus espaços organizados por categoria.'
              : 'Descubra e participe de novos espaços da comunidade.'
            }
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'my-spaces' | 'explore')} className="w-full md:w-auto">
            <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-none">
              <TabsTrigger value="my-spaces" className="text-xs sm:text-sm">
                Meus Espaços ({mySpaces?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="explore" className="text-xs sm:text-sm">
                Explorar ({availableSpaces?.filter(s => !(s as any).isMember && s.visibility === 'public').length || 0})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full md:max-w-xs lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar espaços..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </div>

        <div className="pb-20 lg:pb-0">
          <SpacesGrid
            spacesByCategory={spacesByCategory}
            categories={filteredCategories}
            activeTab={activeTab}
            hasSearchTerm={!!searchTerm}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};