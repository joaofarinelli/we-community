import { useNavigate, useLocation } from 'react-router-dom';
import { Rss, BookOpen, ShoppingBag, Target, Wallet, Store, Trophy, Map, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsFeatureEnabled } from '@/hooks/useCompanyFeatures';

interface CircleSidebarProps {
  onClose?: () => void;
}

export function CircleSidebar({
  onClose
}: CircleSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Feature flags
  const isRankingEnabled = useIsFeatureEnabled('ranking');
  const isMarketplaceEnabled = useIsFeatureEnabled('marketplace');
  const isStoreEnabled = useIsFeatureEnabled('store');
  const isBankEnabled = useIsFeatureEnabled('bank');
  const isChallengesEnabled = useIsFeatureEnabled('challenges');

  return (
    <aside className="w-[280px] h-screen bg-card border-r border-border/50 flex flex-col">
      {/* Content */}
      <div className="flex-1 p-6 space-y-2">
        {/* Feed */}
        <div>
          <Button 
            variant="ghost" 
            className={`w-full justify-start h-[44px] px-4 text-left text-[14px] font-medium transition-all duration-200 ${
              location.pathname === '/dashboard' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => navigate('/dashboard')}
          >
            <Rss className="h-5 w-5 mr-3" />
            Feed
          </Button>
        </div>

        {/* Espaços */}
        <div>
          <Button 
            variant="ghost" 
            className={`w-full justify-start h-[44px] px-4 text-left text-[14px] font-medium transition-all duration-200 ${
              location.pathname.startsWith('/dashboard/spaces') 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => navigate('/dashboard/spaces')}
          >
            <Grid3X3 className="h-5 w-5 mr-3" />
            Espaços
          </Button>
        </div>

        {/* Trilhas */}
        <div>
          <Button 
            variant="ghost" 
            className={`w-full justify-start h-[44px] px-4 text-left text-[14px] font-medium transition-all duration-200 ${
              location.pathname.startsWith('/dashboard/trails') 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => navigate('/dashboard/trails')}
          >
            <Map className="h-5 w-5 mr-3" />
            Trilhas
          </Button>
        </div>

        {/* Ranking */}
        {isRankingEnabled && (
          <div>
            <Button 
              variant="ghost" 
              className={`w-full justify-start h-[44px] px-4 text-left text-[14px] font-medium transition-all duration-200 ${
                location.pathname === '/dashboard/ranking' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => navigate('/dashboard/ranking')}
            >
              <Trophy className="h-5 w-5 mr-3" />
              Ranking
            </Button>
          </div>
        )}

        {/* Cursos */}
        <div>
          <Button 
            variant="ghost" 
            className={`w-full justify-start h-[44px] px-4 text-left text-[14px] font-medium transition-all duration-200 ${
              location.pathname.startsWith('/courses') 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => navigate('/courses')}
          >
            <BookOpen className="h-5 w-5 mr-3" />
            Cursos
          </Button>
        </div>

        {/* Marketplace */}
        {isMarketplaceEnabled && (
          <div>
            <Button 
              variant="ghost" 
              className={`w-full justify-start h-[44px] px-4 text-left text-[14px] font-medium transition-all duration-200 ${
                location.pathname.startsWith('/dashboard/marketplace') 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => navigate('/dashboard/marketplace')}
            >
              <ShoppingBag className="h-5 w-5 mr-3" />
              Marketplace
            </Button>
          </div>
        )}

        {/* Loja */}
        {isStoreEnabled && (
          <div>
            <Button 
              variant="ghost" 
              className={`w-full justify-start h-[44px] px-4 text-left text-[14px] font-medium transition-all duration-200 ${
                location.pathname.startsWith('/dashboard/store') 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => navigate('/dashboard/store')}
            >
              <Store className="h-5 w-5 mr-3" />
              Loja
            </Button>
          </div>
        )}

        {/* Banco */}
        {isBankEnabled && (
          <div>
            <Button 
              variant="ghost" 
              className={`w-full justify-start h-[44px] px-4 text-left text-[14px] font-medium transition-all duration-200 ${
                location.pathname.startsWith('/dashboard/bank') 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => navigate('/dashboard/bank')}
            >
              <Wallet className="h-5 w-5 mr-3" />
              Banco
            </Button>
          </div>
        )}

        {/* Desafios */}
        {isChallengesEnabled && (
          <div>
            <Button 
              variant="ghost" 
              className={`w-full justify-start h-[44px] px-4 text-left text-[14px] font-medium transition-all duration-200 ${
                location.pathname.startsWith('/dashboard/challenges') 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => navigate('/dashboard/challenges')}
            >
              <Target className="h-5 w-5 mr-3" />
              Desafios
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}