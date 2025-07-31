import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, MessageCircle, Users, Settings, Trophy, Target, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { UserDropdown } from '@/components/dashboard/UserDropdown';
import { IconButton } from '@/components/dashboard/IconButton';
import { CircleSidebar } from '@/components/dashboard/CircleSidebar';
import { UserPointsBadge } from '@/components/gamification/UserPointsBadge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useIsAdmin } from '@/hooks/useUserRole';
import { ThemeApplier } from '@/components/ThemeApplier';
import { CompanyLogo } from '@/components/ui/company-logo';
import { NotificationDropdown } from '@/components/dashboard/NotificationDropdown';
import { ChatDialog } from '@/components/chat/ChatDialog';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { StreakDialog } from '@/components/gamification/StreakDialog';
import { AutoStreakCheckIn } from '@/components/gamification/AutoStreakCheckIn';


interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: company } = useCompany();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const isAdmin = useIsAdmin();

  return (
    <div className="h-screen bg-background flex flex-col">
      <ThemeApplier />
      <AutoStreakCheckIn />
      {/* Header */}
      <header className="shrink-0 bg-card border-b border-border z-10">
        <div className="flex items-center justify-between px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
          {/* Left side */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2"
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            
            {isAdmin ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-lg sm:text-xl font-semibold text-foreground hover:text-primary h-auto p-1 sm:p-2 min-w-0">
                    <CompanyLogo 
                      fallbackText="Minha Empresa"
                      textClassName="text-sm sm:text-lg md:text-xl font-semibold truncate"
                      logoClassName="h-6 sm:h-8 w-auto object-contain max-w-[80px] sm:max-w-[120px]"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 sm:w-56 bg-popover border-border z-50">
                  <DropdownMenuItem onClick={() => navigate('/admin/levels')}>
                    <Trophy className="mr-2 h-4 w-4" />
                    Gerenciar Níveis
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/admin/users')}>
                    <Users className="mr-2 h-4 w-4" />
                    Gerenciar Usuários
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/challenges')}>
                    <Target className="mr-2 h-4 w-4" />
                    Gerenciar Desafios
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <CompanyLogo 
                fallbackText="Minha Empresa"
                textClassName="text-sm sm:text-lg md:text-xl font-semibold text-foreground truncate"
                logoClassName="h-6 sm:h-8 w-auto object-contain max-w-[80px] sm:max-w-[120px]"
              />
            )}
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
              <ChatDialog />
            </div>
            <div className="hidden md:block">
              <Button variant="ghost" size="sm" className="p-2">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
            <div className="hidden md:block">
              <StreakDialog>
                <div className="cursor-pointer">
                  <StreakBadge variant="compact" />
                </div>
              </StreakDialog>
            </div>
            <UserDropdown
              name={user?.user_metadata?.display_name}
              email={user?.email}
              imageUrl={user?.user_metadata?.avatar_url}
            />
          </div>
        </div>
      </header>

      {/* Layout with sidebar */}
      <div className="flex flex-1 min-h-0">
        
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <CircleSidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="relative w-80 sm:w-96 h-full bg-background shadow-2xl">
              <CircleSidebar onClose={() => setIsSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

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
            <ChatDialog />
          </div>
        </div>
      </div>

      {/* Padding bottom for mobile navigation */}
      <div className="xl:hidden h-16 lg:h-0" />
    </div>
  );
};