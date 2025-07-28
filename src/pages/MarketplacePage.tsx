import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useMarketplaceCategories } from '@/hooks/useMarketplaceCategories';
import { useMarketplaceItems } from '@/hooks/useMarketplaceItems';
import { useUserCoins } from '@/hooks/useUserPoints';
import { MarketplaceItemCard } from '@/components/marketplace/MarketplaceItemCard';
import { CategoryFilter } from '@/components/marketplace/CategoryFilter';
import { MarketplaceItemSkeleton } from '@/components/marketplace/MarketplaceItemSkeleton';
import { CategoryFilterSkeleton } from '@/components/marketplace/CategoryFilterSkeleton';
import { UserCoinsBadge } from '@/components/gamification/UserPointsBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShoppingBag, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CreateUserItemDialog } from '@/components/marketplace/CreateUserItemDialog';
import { useCoinName } from '@/hooks/useCoinName';

export const MarketplacePage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: categories = [], isLoading: categoriesLoading } = useMarketplaceCategories();
  const { data: items = [], isLoading: itemsLoading } = useMarketplaceItems(selectedCategory || undefined);
  const { data: userCoins } = useUserCoins();
  const { data: coinName = 'WomanCoins' } = useCoinName();

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Count items per category
  const itemCounts = items.reduce((acc, item) => {
    acc[item.category_id] = (acc[item.category_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const isLoading = categoriesLoading || itemsLoading;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Marketplace</h1>
            <p className="text-muted-foreground">
              Use suas {coinName} para adquirir produtos e benefícios exclusivos
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <UserCoinsBadge />
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Anunciar
            </Button>
            <Button asChild variant="outline">
              <Link to="/my-items">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Meus Anúncios
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/dashboard/marketplace/purchases">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Minhas Compras
              </Link>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              {categoriesLoading ? (
                <CategoryFilterSkeleton />
              ) : (
                <CategoryFilter
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  itemCounts={itemCounts}
                />
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <MarketplaceItemSkeleton key={i} />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'Tente buscar por outros termos'
                    : 'Em breve novos produtos serão adicionados ao marketplace'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredItems.map((item) => (
                  <MarketplaceItemCard
                    key={item.id}
                    item={item}
                    userCoins={userCoins?.total_coins || 0}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <CreateUserItemDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </div>
    </DashboardLayout>
  );
};