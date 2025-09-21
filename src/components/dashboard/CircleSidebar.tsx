
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Rss, 
  Grid3X3, 
  Map, 
  Users, 
  Trophy, 
  BookOpen, 
  ShoppingBag, 
  Store, 
  Wallet, 
  Target,
  Settings,
  Calendar
} from 'lucide-react';

import { useCompany } from '@/hooks/useCompany';
import { useIsFeatureEnabled } from '@/hooks/useCompanyFeatures';
import { useIsAdmin } from '@/hooks/useUserRole';

const CircleSidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { data: company } = useCompany();
  const isAdmin = useIsAdmin();

  // Feature flags
  const isRankingEnabled = useIsFeatureEnabled('ranking');
  const isMarketplaceEnabled = useIsFeatureEnabled('marketplace');
  const isStoreEnabled = useIsFeatureEnabled('store');
  const isBankEnabled = useIsFeatureEnabled('bank');
  const isChallengesEnabled = useIsFeatureEnabled('challenges');
  const isTrailsEnabled = useIsFeatureEnabled('trails');
  const isMembersEnabled = useIsFeatureEnabled('members');
  const isCoursesEnabled = useIsFeatureEnabled('courses');
  const isCalendarEnabled = useIsFeatureEnabled('calendar');

  const navigationItems = [
    { name: 'Feed', path: '/dashboard', icon: Rss },
    { name: 'Espaços', path: '/dashboard/spaces', icon: Grid3X3 },
    ...(isTrailsEnabled ? [{ name: 'Trilhas', path: '/dashboard/trails', icon: Map }] : []),
    ...(isMembersEnabled ? [{ name: 'Membros', path: '/dashboard/members', icon: Users }] : []),
    ...(isRankingEnabled ? [{ name: 'Ranking', path: '/dashboard/ranking', icon: Trophy }] : []),
    ...(isCoursesEnabled ? [{ name: 'Cursos', path: '/courses', icon: BookOpen }] : []),
    ...(isMarketplaceEnabled ? [{ name: 'Marketplace', path: '/dashboard/marketplace', icon: ShoppingBag }] : []),
    ...(isStoreEnabled ? [{ name: 'Loja', path: '/dashboard/store', icon: Store }] : []),
    ...(isBankEnabled ? [{ name: 'Banco', path: '/dashboard/bank', icon: Wallet }] : []),
    ...(isChallengesEnabled ? [{ name: 'Desafios', path: '/dashboard/challenges', icon: Target }] : []),
    ...(isCalendarEnabled ? [{ name: 'Calendário', path: '/dashboard/calendar', icon: Calendar }] : []),
    ...(isAdmin ? [{ name: 'Admin', path: '/admin/settings', icon: Settings }] : []),
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return currentPath === '/dashboard';
    }
    if (path === '/courses') {
      return currentPath.startsWith('/courses');
    }
    if (path === '/admin/settings') {
      return currentPath.startsWith('/admin');
    }
    return currentPath.startsWith(path);
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-50 lg:hidden">
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl sm:rounded-full p-1.5 sm:p-2 shadow-lg max-w-[90vw] overflow-x-auto">
        <div className="flex items-center space-x-0.5 sm:space-x-1 min-w-max px-1">
          {navigationItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/dashboard'}
                className="group relative flex-shrink-0"
              >
                <div 
                  className={`
                    p-2 sm:p-3 rounded-xl sm:rounded-full transition-all duration-200 
                    ${active 
                      ? 'text-white shadow-lg' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                  `}
                  style={{
                    backgroundColor: active ? company?.primary_color || '#3b82f6' : undefined,
                  }}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                
                {/* Tooltip - only show on larger screens */}
                <div className="hidden sm:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-popover text-popover-foreground rounded border shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {item.name}
                </div>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CircleSidebar;
