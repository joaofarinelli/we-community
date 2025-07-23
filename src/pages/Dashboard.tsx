import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogOut, Bell } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/AppSidebar';
import { SetupChecklist } from '@/components/dashboard/SetupChecklist';

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { data: company } = useCompany();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background to-background-secondary">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col animate-fade-in">
          {/* Header */}
          <header className="glass border-b border-border/20 px-6 py-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <SidebarTrigger className="hover:bg-muted/50 transition-colors lg:hidden" />
                <nav className="hidden md:flex items-center space-x-8">
                  <span className="text-sm font-semibold text-gradient cursor-pointer">Home</span>
                  <span className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 cursor-pointer font-medium">Courses</span>
                  <span className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 cursor-pointer font-medium">Events</span>
                  <span className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 cursor-pointer font-medium">Members</span>
                  <span className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 cursor-pointer font-medium">Leaderboard</span>
                </nav>
              </div>
              
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="hover:bg-muted/50">
                  <Bell className="h-4 w-4" />
                </Button>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
                  <div className="w-2 h-2 rounded-full bg-success animate-float"></div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {user?.user_metadata?.first_name || user?.email}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={signOut}
                  className="shadow-soft hover:shadow-medium transition-all duration-200 hover:-translate-y-0.5"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </header>

          {/* Trial Alert */}
          <div className="mx-6 mt-6">
            <Alert className="border-warning/30 bg-gradient-to-r from-warning/10 to-warning/5 shadow-soft animate-slide-down">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>
                <AlertDescription className="font-medium text-warning-foreground">
                  Você está em período de teste. Faça upgrade para acessar todos os recursos.
                </AlertDescription>
              </div>
            </Alert>
          </div>

          {/* Main Content */}
          <main className="flex-1 p-6 space-y-8">
            <div className="max-w-5xl mx-auto">
              <div className="space-y-4 animate-slide-up">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-elegant">
                    <span className="text-xl">👋</span>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gradient mb-1 font-heading">
                      Bem-vindo!
                    </h1>
                    <p className="text-lg text-muted-foreground font-medium">
                      {company?.name || "Sua Comunidade"}
                    </p>
                  </div>
                </div>
                
                <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
                  Configure sua comunidade para começar a engajar seus membros e criar uma experiência incrível.
                </p>
              </div>
              
              <div className="animate-fade-blur" style={{ animationDelay: '0.2s' }}>
                <SetupChecklist />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};