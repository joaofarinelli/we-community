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
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b bg-background flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <nav className="hidden md:flex items-center gap-6">
                <Button variant="ghost" className="text-sm font-medium">
                  Home
                </Button>
                <Button variant="ghost" className="text-sm font-medium text-muted-foreground">
                  Courses
                </Button>
                <Button variant="ghost" className="text-sm font-medium text-muted-foreground">
                  Events
                </Button>
                <Button variant="ghost" className="text-sm font-medium text-muted-foreground">
                  Members
                </Button>
                <Button variant="ghost" className="text-sm font-medium text-muted-foreground">
                  Leaderboard
                </Button>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {user?.user_metadata?.first_name || user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </header>

          {/* Trial Alert */}
          <Alert className="m-6 mb-0 bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800">
              Você está em período de teste. Faça upgrade para acessar todos os recursos.
            </AlertDescription>
          </Alert>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <div className="max-w-4xl space-y-8">
              <div className="space-y-4">
                <h1 className="text-2xl font-bold">
                  Bem-vindo ao {company?.name || "sua comunidade"}! 👋
                </h1>
                <p className="text-muted-foreground">
                  Vamos começar configurando sua comunidade. Complete as tarefas abaixo para ativar todos os recursos.
                </p>
              </div>

              <SetupChecklist />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};