import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseContext } from '@/hooks/useSupabaseContext';
import { useIsFeatureEnabled } from '@/hooks/useCompanyFeatures';
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
  MapPin,
  Megaphone,
  DollarSign,
  CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompanyRealtime } from '@/hooks/useCompanyRealtime';
import { WhatsAppFloatingButton } from '@/components/whatsapp/WhatsAppFloatingButton';

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
      { label: 'Revisão de questões dissertativas', path: '/admin/quiz-reviews' },
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
    label: 'Marketplace',
    key: 'marketplace',
    featureRequired: 'marketplace' as const,
    subItems: [
      { label: 'Gerenciar marketplace', path: '/admin/marketplace' },
      { label: 'Moderação do marketplace', path: '/admin/marketplace/moderation' },
      { label: 'Termos do marketplace', path: '/admin/marketplace/terms' },
    ]
  },
  {
    icon: Store,
    label: 'Loja',
    key: 'store',
    featureRequired: 'store' as const,
    subItems: [
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
      { label: 'Moderação de submissões', path: '/admin/challenges/submissions' },
      { label: 'Registros de atividades', path: '/admin/activity-logs' },
    ]
  },
  {
    icon: Megaphone,
    label: 'Operações',
    key: 'operations',
    subItems: [
      { label: 'Ações em massa', path: '/admin/bulk-actions' },
    ]
  },
  {
    icon: DollarSign,
    label: 'Financeiro',
    key: 'financial',
  subItems: [
      { label: 'Configuração de Pagamentos', path: '/admin/financial/config' },
      { label: 'Vendas & Transações', path: '/admin/financial/transactions' },
      { label: 'Relatórios Financeiros', path: '/admin/financial/reports' },
      { label: 'Produtos TMB', path: '/admin/tmb/products' },
      { label: 'Reconciliação', path: '/admin/financial/reconciliation' },
    ]
  },
  {
    icon: CalendarDays,
    label: 'Eventos',
    key: 'events',
    subItems: [
      { label: 'Relatórios de eventos', path: '/admin/events/reports' },
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
  
  // Filter menu items based on enabled features
  const isMarketplaceEnabled = useIsFeatureEnabled('marketplace');
  const isStoreEnabled = useIsFeatureEnabled('store');
  
  const filteredMenuItems = mainMenuItems.filter(item => {
    if (item.featureRequired === 'marketplace') return isMarketplaceEnabled;
    if (item.featureRequired === 'store') return isStoreEnabled;
    return true;
  });
  const [activeMenu, setActiveMenu] = useState<string | null>(() => {
    // Determinar menu ativo baseado na rota atual
    const currentPath = location.pathname;
    for (const menu of filteredMenuItems) {
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
      const menu = filteredMenuItems.find(m => m.key === menuKey);
      if (menu && menu.subItems.length > 0) {
        navigate(menu.subItems[0].path);
      }
    }
  };

  const activeMenuData = filteredMenuItems.find(m => m.key === activeMenu);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-screen bg-background flex overflow-hidden">
        {/* Main Menu Sidebar - Hidden on mobile */}
        <div className="hidden md:flex w-16 bg-card border-r border-border flex-col">
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
                {filteredMenuItems.map((item) => (
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

        {/* Submenu Sidebar - Hidden on mobile, collapsible on tablet */}
        {activeMenuData && (
          <div className="hidden lg:flex w-64 bg-card border-r border-border flex-col">
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
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 h-full">
            <div className="h-full overflow-y-auto p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>

        {/* WhatsApp Floating Button */}
        <WhatsAppFloatingButton />
      </div>
    </TooltipProvider>
  );
};