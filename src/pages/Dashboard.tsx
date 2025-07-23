import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { Button } from '@/components/ui/button';
import { Bell, MessageCircle, Heart, Menu } from 'lucide-react';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { UserAvatar } from '@/components/dashboard/UserAvatar';
import { IconButton } from '@/components/dashboard/IconButton';
import { CircleSidebar } from '@/components/dashboard/CircleSidebar';
import { SetupCard } from '@/components/dashboard/SetupCard';

export const Dashboard = () => {
  const { user } = useAuth();
  const { data: company } = useCompany();

  const userName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Usuário';

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/50 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Company Name + Navigation */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="lg:hidden p-1">
                <Menu className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-semibold">
                {company?.name || "Minha Comunidade"}
              </h1>
            </div>
            
            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-6">
              <span className="text-sm font-medium cursor-pointer hover:text-primary transition-colors">
                Home
              </span>
              <span className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Courses
              </span>
              <span className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Events
              </span>
              <span className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Members
              </span>
              <span className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Leaderboard
              </span>
            </nav>
          </div>

          {/* Right: Search + Icons + Avatar */}
          <div className="flex items-center gap-4">
            <SearchBar />
            <div className="flex items-center gap-1">
              <IconButton icon={Bell} />
              <IconButton icon={MessageCircle} />
              <IconButton icon={Heart} />
            </div>
            <UserAvatar 
              name={user?.user_metadata?.first_name}
              email={user?.email}
              size="md"
            />
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Left Sidebar */}
        <CircleSidebar />

        {/* Main Content */}
        <main className="flex-1 p-8 max-w-4xl">
          <div className="space-y-8">
            {/* Welcome Title */}
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Boas-vindas à plataforma, {userName}!
              </h1>
            </div>

            {/* Setup Checklist Card */}
            <SetupCard />
          </div>
        </main>
      </div>
    </div>
  );
};