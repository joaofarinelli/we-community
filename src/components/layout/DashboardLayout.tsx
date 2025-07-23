import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, MessageCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { UserAvatar } from '@/components/dashboard/UserAvatar';
import { IconButton } from '@/components/dashboard/IconButton';
import { CircleSidebar } from '@/components/dashboard/CircleSidebar';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: company } = useCompany();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
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
            
            <h1 className="text-xl font-semibold text-foreground">
              {company?.name || 'Minha Empresa'}
            </h1>
            
            {/* Search - moved to left side with max width */}
            <div className="max-w-[130px] ml-4">
              <SearchBar />
            </div>
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
            <Button variant="ghost" size="sm" className="text-foreground hover:text-primary">
              Membros
            </Button>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-2 flex-1 justify-end">
            <IconButton icon={Bell} />
            <IconButton icon={MessageCircle} />
            <IconButton icon={Users} />
            <UserAvatar 
              name={user?.user_metadata?.first_name}
              email={user?.email}
              size="md"
            />
          </div>
        </div>
      </header>

      {/* Layout with sidebar */}
      <div className="flex pt-16">
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
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};