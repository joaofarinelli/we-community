import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Menu, Search, Bell, MessageCircle, Users, Settings, Trophy, Target, MapPin, Rss, Grid3X3, Map, BookOpen, ShoppingBag, Store, Wallet, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { UserDropdown } from '@/components/dashboard/UserDropdown';
import { IconButton } from '@/components/dashboard/IconButton';
import { AppSidebar } from '@/components/dashboard/AppSidebar';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { UserPointsBadge } from '@/components/gamification/UserPointsBadge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSupabaseContext } from '@/hooks/useSupabaseContext';
import { useIsAdmin } from '@/hooks/useUserRole';
import { useIsFeatureEnabled } from '@/hooks/useCompanyFeatures';
import { ThemeApplier } from '@/components/ThemeApplier';
import { CompanyLogo } from '@/components/ui/company-logo';
import { NotificationDropdown } from '@/components/dashboard/NotificationDropdown';
import { ChatDialog } from '@/components/chat/ChatDialog';
import { UtilitiesDialog } from '@/components/dashboard/UtilitiesDialog';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { StreakDialog } from '@/components/gamification/StreakDialog';
import { useRealtimePosts } from '@/hooks/useRealtimePosts';
import { AutoStreakCheckIn } from '@/components/gamification/AutoStreakCheckIn';
import { OnboardingChecker } from '@/components/onboarding/OnboardingChecker';
import { WhatsAppFloatingButton } from '@/components/whatsapp/WhatsAppFloatingButton';


interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: company } = useCompany();
  const { data: userProfile } = useUserProfile();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatConversationId, setChatConversationId] = useState<string | null>(null);
  
  // Handle chat parameter from URL
  useEffect(() => {
    const chatParam = searchParams.get('chat');
    if (chatParam) {
      setChatConversationId(chatParam);
      setChatOpen(true);
      // Remove the chat parameter from URL
      searchParams.delete('chat');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  
  const isAdmin = useIsAdmin();
  
  // Feature flags for mobile menu
  const isTrailsEnabled = useIsFeatureEnabled('trails');
  const isMembersEnabled = useIsFeatureEnabled('members');
  const isCoursesEnabled = useIsFeatureEnabled('courses');
  const isRankingEnabled = useIsFeatureEnabled('ranking');
  const isMarketplaceEnabled = useIsFeatureEnabled('marketplace');
  const isStoreEnabled = useIsFeatureEnabled('store');
  const isBankEnabled = useIsFeatureEnabled('bank');
  const isChallengesEnabled = useIsFeatureEnabled('challenges');
  const isCalendarEnabled = useIsFeatureEnabled('calendar');
  
  // Set Supabase context for RLS policies
  useSupabaseContext();
  
  // Initialize realtime subscriptions for posts
  useRealtimePosts();

  // Generate mobile navigation items based on feature flags
  const mobileNavItems = [
    { name: 'Feed', path: '/dashboard', icon: Rss },
    { name: 'Espaços', path: '/dashboard/spaces', icon: Grid3X3 },
    ...(isTrailsEnabled ? [{ name: 'Trilhas', path: '/dashboard/trails', icon: Map }] : []),
    ...(isMembersEnabled ? [{ name: 'Membros', path: '/dashboard/members', icon: Users }] : []),
    ...(isCoursesEnabled ? [{ name: 'Cursos', path: '/courses', icon: BookOpen }] : []),
    ...(isRankingEnabled ? [{ name: 'Ranking', path: '/dashboard/ranking', icon: Trophy }] : []),
    ...(isMarketplaceEnabled ? [{ name: 'Marketplace', path: '/dashboard/marketplace', icon: ShoppingBag }] : []),
    ...(isStoreEnabled ? [{ name: 'Loja', path: '/dashboard/store', icon: Store }] : []),
    ...(isBankEnabled ? [{ name: 'Banco', path: '/dashboard/bank', icon: Wallet }] : []),
    ...(isChallengesEnabled ? [{ name: 'Desafios', path: '/dashboard/challenges', icon: Target }] : []),
    ...(isCalendarEnabled ? [{ name: 'Calendário', path: '/dashboard/calendar', icon: Calendar }] : []),
  ].slice(0, 5); // Limit to 5 items for mobile layout
  
  const isActiveRoute = (path: string) => {
    const currentPath = window.location.pathname;
    if (path === '/dashboard') {
      return currentPath === '/dashboard';
    }
    if (path === '/courses') {
      return currentPath.startsWith('/courses');
    }
    return currentPath.startsWith(path);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <ThemeApplier />
        <AutoStreakCheckIn />
        <OnboardingChecker />
        
        {/* Sidebar */}
        <AppSidebar />

        <SidebarInset className="flex flex-col flex-1">
          {/* Header */}
          <header className="sticky top-0 shrink-0 bg-card border-b border-border z-30">
            <div className="flex items-center justify-between px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
              {/* Left side */}
              <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                {/* Sidebar Toggle */}
                <SidebarTrigger className="p-2" />
                
                {/* Espaço vazio onde estava a logo */}
              </div>

          {/* Right side */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-1 justify-end min-w-0">
            {/* Search Bar - responsive width */}
            <div className="max-w-[100px] sm:max-w-[140px] md:max-w-[180px] lg:max-w-[220px] xl:max-w-[260px] mr-1 sm:mr-2">
              <SearchBar />
            </div>
            
            {/* Desktop Elements */}
            <div className="hidden lg:flex items-center space-x-2">
              <UserPointsBadge />
              <ChatDialog 
                isOpen={chatOpen}
                onOpenChange={setChatOpen}
                initialConversationId={chatConversationId}
              />
              <UtilitiesDialog />
              <NotificationDropdown />
              <StreakDialog>
                <div className="cursor-pointer">
                  <StreakBadge variant="compact" />
                </div>
              </StreakDialog>
            </div>
            
            {/* Tablet Elements */}
            <div className="hidden md:flex lg:hidden items-center space-x-1">
              <UserPointsBadge />
              <ChatDialog 
                isOpen={chatOpen}
                onOpenChange={setChatOpen}
                initialConversationId={chatConversationId}
              />
              <NotificationDropdown />
            </div>
            
            {/* Mobile Elements */}
            <div className="flex md:hidden items-center space-x-1">
              <NotificationDropdown />
            </div>
            
            <UserDropdown
              name={userProfile?.first_name && userProfile?.last_name 
                ? `${userProfile.first_name} ${userProfile.last_name}` 
                : (userProfile?.first_name || user?.user_metadata?.display_name)
              }
              email={userProfile?.email || user?.email}
              imageUrl={userProfile?.avatar_url || user?.user_metadata?.avatar_url}
            />
          </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80 shadow-lg">
            <div className="flex items-center justify-between px-1 py-2 safe-area-bottom max-w-[100vw] overflow-x-auto">
              {/* Navigation Items */}
              <div className="flex items-center justify-around flex-1 min-w-0">
                {mobileNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActiveRoute(item.path);
                  
                  return (
                    <Button 
                      key={item.name}
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-foreground flex-col space-y-1 h-auto py-2 px-1 sm:px-2 min-w-0 text-xs flex-shrink-0 transition-all duration-200"
                      style={{
                        color: active ? (company?.primary_color || '#3b82f6') : undefined,
                      }}
                      onClick={() => navigate(item.path)}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <div className="text-[9px] sm:text-[10px] font-medium whitespace-nowrap">
                        {item.name}
                      </div>
                    </Button>
                  );
                })}
              </div>
              
              {/* Utility Items */}
              <div className="flex items-center space-x-1 ml-1 flex-shrink-0">
                <div className="sm:hidden">
                  <UserPointsBadge />
                </div>
                <div className="md:hidden">
                  <ChatDialog 
                    isOpen={chatOpen}
                    onOpenChange={setChatOpen}
                    initialConversationId={chatConversationId}
                  />
                </div>
                <div className="md:hidden">
                  <UtilitiesDialog />
                </div>
              </div>
            </div>
          </div>

          {/* Padding bottom for mobile navigation */}
          <div className="lg:hidden h-20 safe-area-bottom" />
        </SidebarInset>
        
        {/* WhatsApp Floating Button */}
        <WhatsAppFloatingButton />
      </div>
    </SidebarProvider>
  );
};