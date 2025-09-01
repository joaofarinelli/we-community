import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseContext } from '@/hooks/useSupabaseContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Users, 
  Shield, 
  Tags, 
  Trophy, 
  Activity, 
  Settings, 
  User, 
  Link,
  BookOpen,
  Target,
  FileText,
  BarChart3,
  HelpCircle,
  Code,
  ArrowLeft,
  ShoppingBag,
  Store,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompanyRealtime } from '@/hooks/useCompanyRealtime';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const mainMenuItems = [
  {
    icon: Users,
    label: 'Audiência',
    key: 'audience',
    subItems: [
      { label: 'Gerenciar audiência', path: '/admin/users' },
      { label: 'Grupos de acesso', path: '/admin/access-groups' },
      { label: 'Segmentos', path: '/admin/segments' },
      { label: 'Onboarding', path: '/admin/onboarding' },
    ]
  },
  {
    icon: FileText,
    label: 'Conteúdo',
    key: 'content',
    subItems: [
      { label: 'Publicações', path: '/admin/content/posts' },
      { label: 'Categorias', path: '/admin/content/categories' },
      { label: 'Espaços', path: '/admin/content/spaces' },
      { label: 'Moderação', path: '/admin/content/moderation' },
    ]
  },
  {
    icon: Tags,
    label: 'Customização',
    key: 'customization',
    subItems: [
      { label: 'Tags', path: '/admin/tags' },
      { label: 'Campos de perfil', path: '/admin/profile-fields' },
    ]
  },
  {
    icon: BookOpen,
    label: 'Cursos',
    key: 'courses',
    subItems: [
      { label: 'Gerenciar cursos', path: '/admin/courses' },
    ]
  },
  {
    icon: MapPin,
    label: 'Trilhas',
    key: 'trails',
    subItems: [
      { label: 'Gerenciar trilhas', path: '/admin/trails' },
      { label: 'Selos de trilhas', path: '/admin/trail-badges' },
    ]
  },
  {
    icon: ShoppingBag,
    label: 'Marketplace & Loja',
    key: 'marketplace',
    subItems: [
      { label: 'Gerenciar marketplace', path: '/admin/marketplace' },
      { label: 'Gerenciar loja', path: '/admin/store' },
      { label: 'Categorias da loja', path: '/admin/store/categories' },
    ]
  },
  {
    icon: Trophy,
    label: 'Gamificação',
    key: 'gamification',
    subItems: [
      { label: 'Níveis', path: '/admin/levels' },
      { label: 'Desafios', path: '/admin/challenges' },
      { label: 'Registros de atividades', path: '/admin/activity-logs' },
    ]
  },
  {
    icon: Settings,
    label: 'Configurações',
    key: 'settings',
    subItems: [
      { label: 'Configurações gerais', path: '/admin/settings' },
      { label: 'Analytics', path: '/admin/analytics' },
      { label: 'Suporte', path: '/admin/support' },
      { label: 'Desenvolvedores', path: '/admin/developers' },
    ]
  }
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize Supabase context for multi-company users
  useSupabaseContext();
  useCompanyRealtime();
  const [activeMenu, setActiveMenu] = useState<string | null>(() => {
    // Determinar menu ativo baseado na rota atual
    const currentPath = location.pathname;
    for (const menu of mainMenuItems) {
      if (menu.subItems.some(item => item.path === currentPath)) {
        return menu.key;
      }
    }
    return null;
  });

  const handleMainMenuClick = (menuKey: string) => {
    if (activeMenu === menuKey) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menuKey);
      // Navegar para o primeiro item do submenu
      const menu = mainMenuItems.find(m => m.key === menuKey);
      if (menu && menu.subItems.length > 0) {
        navigate(menu.subItems[0].path);
      }
    }
  };

  const activeMenuData = mainMenuItems.find(m => m.key === activeMenu);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background flex">
        {/* Main Menu Sidebar */}
        <div className="w-16 bg-card border-r border-border flex flex-col">
          {/* Header */}
          <div className="p-2 border-b border-border">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/dashboard')}
                  className="text-muted-foreground hover:text-foreground w-full"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Voltar ao Dashboard</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              <div className="space-y-1">
                {mainMenuItems.map((item) => (
                  <Tooltip key={item.key}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMainMenuClick(item.key)}
                        className={cn(
                          "w-full",
                          activeMenu === item.key && "bg-muted text-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submenu Sidebar */}
        {activeMenuData && (
          <div className="w-64 bg-card border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {activeMenuData.label}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-2">
                <div className="space-y-1">
                  {activeMenuData.subItems.map((subItem) => (
                    <Button
                      key={subItem.path}
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(subItem.path)}
                      className={cn(
                        "w-full justify-start text-left",
                        location.pathname === subItem.path && "bg-background text-foreground shadow-sm"
                      )}
                    >
                      {subItem.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};