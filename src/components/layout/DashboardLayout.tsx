import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, MessageCircle, Users, Settings, Trophy, Target } from 'lucide-react';
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
      {/* Header */}
      <header className="shrink-0 bg-card border-b border-border z-10">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side */}
          <div className="flex items-center space-x-4 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {isAdmin ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-xl font-semibold text-foreground hover:text-primary h-auto p-2">
                    <CompanyLogo 
                      fallbackText="Minha Empresa"
                      textClassName="text-xl font-semibold"
                      logoClassName="h-8 w-auto object-contain max-w-[120px]"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-popover border-border z-50">
                  <DropdownMenuItem onClick={() => navigate('/admin/levels')}>
                    <Trophy className="mr-2 h-4 w-4" />
                    Gerenciar Níveis
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações da Empresa
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
                textClassName="text-xl font-semibold text-foreground"
                logoClassName="h-8 w-auto object-contain max-w-[120px]"
              />
            )}
          </div>

          {/* Center - Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-foreground hover:text-primary"
              onClick={() => navigate('/dashboard')}
            >
              Feed
            </Button>
            <Button variant="ghost" size="sm" className="text-foreground hover:text-primary">
              Espaços
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-foreground hover:text-primary"
              onClick={() => navigate('/dashboard/members')}
            >
              Membros
            </Button>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-2 flex-1 justify-end">
            {/* Search Bar - moved to right side */}
            <div className="max-w-[200px] mr-2">
              <SearchBar />
            </div>
            <UserPointsBadge />
            <IconButton icon={Bell} />
            <IconButton icon={MessageCircle} />
            <IconButton icon={Users} />
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
          <div className="lg:hidden fixed inset-0 z-40">
            <div 
              className="absolute inset-0 bg-black/20" 
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="relative">
              <CircleSidebar onClose={() => setIsSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};