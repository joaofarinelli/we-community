import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Menu, Search, Bell, MessageCircle, Users, Settings, Trophy, Target, MapPin } from 'lucide-react';
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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
  
  // Set Supabase context for RLS policies
  useSupabaseContext();
  
  // Initialize realtime subscriptions for posts
  useRealtimePosts();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <ThemeApplier />
        <AutoStreakCheckIn />
        <OnboardingChecker />
        
        {/* Desktop Sidebar */}
        <AppSidebar />

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative w-80 sm:w-96 h-full bg-background shadow-2xl">
              <AppSidebar onClose={() => setIsMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        <SidebarInset className="flex flex-col flex-1">
          {/* Header */}
          <header className="sticky top-0 shrink-0 bg-card border-b border-border z-30">
            <div className="flex items-center justify-between px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
              {/* Left side */}
              <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                {/* Desktop Sidebar Toggle */}
                <div className="hidden lg:block">
                  <SidebarTrigger className="p-2" />
                </div>
                
                {/* Mobile Sidebar Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden p-2"
                >
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                
                {/* Espaço vazio onde estava a logo */}
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-1 sm:space-x-2 flex-1 justify-end min-w-0">
                {/* Search Bar - responsive width */}
                <div className="max-w-[120px] sm:max-w-[160px] md:max-w-[200px] lg:max-w-[240px] mr-1 sm:mr-2">
                  <SearchBar />
                </div>
                <div className="hidden sm:block">
                  <UserPointsBadge />
                </div>
                <div className="hidden md:block">
                  <ChatDialog 
                    isOpen={chatOpen}
                    onOpenChange={setChatOpen}
                    initialConversationId={chatConversationId}
                  />
                </div>
                <div className="hidden md:block">
                  <UtilitiesDialog />
                </div>
                <div className="hidden md:block">
                  <NotificationDropdown />
                </div>
                <div className="hidden md:block">
                  <StreakDialog>
                    <div className="cursor-pointer">
                      <StreakBadge variant="compact" />
                    </div>
                  </StreakDialog>
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
          <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:bg-transparent lg:border-t-0 lg:relative lg:bottom-auto">
            <div className="flex items-center justify-around px-4 py-2 lg:hidden">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-foreground hover:text-primary flex-col space-y-1 h-auto py-2"
                onClick={() => navigate('/dashboard')}
              >
                <div className="text-xs">Feed</div>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-foreground hover:text-primary flex-col space-y-1 h-auto py-2"
                onClick={() => navigate('/dashboard/spaces')}
              >
                <div className="text-xs">Espaços</div>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-foreground hover:text-primary flex-col space-y-1 h-auto py-2"
                onClick={() => navigate('/dashboard/trails')}
              >
                <div className="text-xs">Trilhas</div>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-foreground hover:text-primary flex-col space-y-1 h-auto py-2"
                onClick={() => navigate('/dashboard/members')}
              >
                <div className="text-xs">Membros</div>
              </Button>
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

          {/* Padding bottom for mobile navigation */}
          <div className="xl:hidden h-16 lg:h-0" />
        </SidebarInset>
        
        {/* WhatsApp Floating Button */}
        <WhatsAppFloatingButton />
      </div>
    </SidebarProvider>
  );
};