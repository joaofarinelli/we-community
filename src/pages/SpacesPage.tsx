import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserMemberSpaces } from '@/hooks/useUserMemberSpaces';
import { useAvailableSpaces } from '@/hooks/useAvailableSpaces';
import { useSpaceCategories } from '@/hooks/useSpaceCategories';
import { SpacesSidebar } from '@/components/spaces/SpacesSidebar';
import { SpacesHeader } from '@/components/spaces/SpacesHeader';
import { SpacesGrid } from '@/components/spaces/SpacesGrid';
import { Loader2 } from 'lucide-react';
import { PageBanner } from '@/components/ui/page-banner';

export const SpacesPage = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'my-spaces' | 'explore'>('my-spaces');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'members' | 'activity' | 'recent'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  
  const { data: categories, isLoading: categoriesLoading } = useSpaceCategories();
  const { data: mySpaces, isLoading: mySpacesLoading } = useUserMemberSpaces();
  const { data: availableSpaces, isLoading: availableSpacesLoading } = useAvailableSpaces();

  const isLoading = categoriesLoading || mySpacesLoading || availableSpacesLoading;

  // Get the current spaces based on active tab
  const currentSpaces = activeTab === 'my-spaces' ? mySpaces : availableSpaces;

  // Group spaces by category and apply filters
  const { spacesByCategory, filteredSpaces } = useMemo(() => {
    if (!currentSpaces) return { spacesByCategory: {}, filteredSpaces: [] };

    // Group by category
    const grouped = currentSpaces.reduce((acc, space) => {
      const categoryId = space.category_id || 'uncategorized';
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(space);
      return acc;
    }, {} as Record<string, typeof currentSpaces>);

    // Apply filters
    let filtered = selectedCategoryId === 'all' 
      ? currentSpaces 
      : grouped[selectedCategoryId] || [];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(space =>
        space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        space.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply visibility filter
    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(space => space.visibility === visibilityFilter);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'members':
          return ((b as any).memberCount || 0) - ((a as any).memberCount || 0);
        case 'activity':
          // Sort by activity (placeholder - would need real activity data)
          return 0;
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return { spacesByCategory: grouped, filteredSpaces: filtered };
  }, [currentSpaces, selectedCategoryId, searchTerm, visibilityFilter, sortBy]);

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
      <PageBanner bannerType="spaces" />
      
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <SpacesSidebar
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={setSelectedCategoryId}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          spacesByCategory={spacesByCategory}
          mySpacesCount={mySpaces?.length || 0}
          exploreSpacesCount={availableSpaces?.filter(s => !(s as any).isMember && s.visibility === 'public').length || 0}
        />

        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6">
          <SpacesHeader
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            visibilityFilter={visibilityFilter}
            onVisibilityFilterChange={setVisibilityFilter}
            totalSpaces={filteredSpaces.length}
            activeTab={activeTab}
          />

          <SpacesGrid
            spaces={filteredSpaces}
            activeTab={activeTab}
            viewMode={viewMode}
            selectedCategoryId={selectedCategoryId}
            spacesByCategory={spacesByCategory}
            categories={categories || []}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};