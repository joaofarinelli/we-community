
import { Rss, Grid3X3, Map, Users, Trophy, BookOpen, ShoppingBag, Store, Wallet, Target, Settings, Calendar } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { useCompany } from "@/hooks/useCompany";
import { CompanyLogo } from "@/components/ui/company-logo";
import { useIsFeatureEnabled } from "@/hooks/useCompanyFeatures";
import { useIsAdmin } from "@/hooks/useUserRole";

interface AppSidebarProps {
  onClose?: () => void;
}

export function AppSidebar({ onClose }: AppSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { data: company, isLoading: companyLoading } = useCompany();
  const collapsed = state === "collapsed";
  const isAdmin = useIsAdmin();
  
  // Feature flags
  const isRankingEnabled = useIsFeatureEnabled('ranking');
  const isMarketplaceEnabled = useIsFeatureEnabled('marketplace');
  const isStoreEnabled = useIsFeatureEnabled('store');
  const isBankEnabled = useIsFeatureEnabled('bank');
  const isChallengesEnabled = useIsFeatureEnabled('challenges');
  const isTrailsEnabled = useIsFeatureEnabled('trails');
  const isMembersEnabled = useIsFeatureEnabled('members');
  const isCoursesEnabled = useIsFeatureEnabled('courses');
  const isCalendarEnabled = useIsFeatureEnabled('calendar');

  // Debug logs for troubleshooting
  console.log('AppSidebar Debug:', {
    company,
    companyLoading,
    isAdmin,
    pathname: currentPath,
    collapsed,
    features: {
      ranking: isRankingEnabled,
      marketplace: isMarketplaceEnabled,
      store: isStoreEnabled,
      bank: isBankEnabled,
      challenges: isChallengesEnabled,
      trails: isTrailsEnabled,
      members: isMembersEnabled,
      courses: isCoursesEnabled,
      calendar: isCalendarEnabled,
    }
  });
  
  // Dynamic main items based on enabled features
  const mainItems = [
    { title: "Feed", url: "/dashboard", icon: Rss },
    { title: "Espaços", url: "/dashboard/spaces", icon: Grid3X3 },
    ...(isCoursesEnabled ? [{ title: "Cursos", url: "/courses", icon: BookOpen }] : []),
    ...(isTrailsEnabled ? [{ title: "Trilhas", url: "/dashboard/trails", icon: Map }] : []),
    ...(isMembersEnabled ? [{ title: "Membros", url: "/dashboard/members", icon: Users }] : []),
    ...(isRankingEnabled ? [{ title: "Ranking", url: "/dashboard/ranking", icon: Trophy }] : []),
    ...(isMarketplaceEnabled ? [{ title: "Marketplace", url: "/dashboard/marketplace", icon: ShoppingBag }] : []),
    ...(isStoreEnabled ? [{ title: "Loja", url: "/dashboard/store", icon: Store }] : []),
    ...(isBankEnabled ? [{ title: "Banco", url: "/dashboard/bank", icon: Wallet }] : []),
    ...(isChallengesEnabled ? [{ title: "Desafios", url: "/dashboard/challenges", icon: Target }] : []),
    ...(isCalendarEnabled ? [{ title: "Calendário", url: "/dashboard/calendar", icon: Calendar }] : []),
    ...(isAdmin ? [{ title: "Administração", url: "/admin/settings", icon: Settings }] : []),
  ];

  // Debug main items array
  console.log('MainItems count:', mainItems.length, mainItems);

  // Fallback items in case all features are disabled
  const fallbackItems = [
    { title: "Feed", url: "/dashboard", icon: Rss },
    { title: "Espaços", url: "/dashboard/spaces", icon: Grid3X3 },
  ];

  // Use fallback if no items (shouldn't happen but safety check)
  const finalItems = mainItems.length > 0 ? mainItems : fallbackItems;

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === "/dashboard";
    }
    if (path === "/courses") {
      return currentPath.startsWith("/courses");
    }
    if (path === "/admin/settings") {
      return currentPath.startsWith("/admin");
    }
    return currentPath.startsWith(path);
  };

  const handleNavClick = (url: string) => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card/95 backdrop-blur-sm border-r border-border/50">
        {/* Company Header */}
        {!collapsed && (
          <div className="p-4 border-b border-border/50 h-[72px] flex items-center bg-card/50">
            <CompanyLogo 
              fallbackText="Minha Empresa"
              textClassName="text-lg font-semibold text-foreground"
              logoClassName="h-8 w-auto object-contain max-w-[150px]"
            />
          </div>
        )}
        
        {/* Collapsed Header */}
        {collapsed && (
          <div className="p-2 border-b border-border/50 h-[72px] flex items-center justify-center bg-card/50">
            <CompanyLogo 
              fallbackText="MC"
              logoClassName="h-8 w-8 object-contain rounded"
            />
          </div>
        )}

        {/* Main Navigation */}
        <SidebarGroup className="p-2 flex-1">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {finalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                     <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      onClick={() => handleNavClick(item.url)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 text-foreground hover:bg-muted/50 relative group"
                      style={({ isActive: navIsActive }) => {
                        const active = isActive(item.url);
                        if (active) {
                          return {
                            backgroundColor: company?.primary_color || '#3b82f6',
                            color: company?.button_text_color ?? "#fff",
                            boxShadow: `0 2px 8px ${company?.primary_color || '#3b82f6'}30`,
                          };
                        }
                        return {};
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive(item.url) && company?.primary_color) {
                          e.currentTarget.style.backgroundColor = `${company.primary_color}15`;
                          e.currentTarget.style.color = company.primary_color;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive(item.url)) {
                          e.currentTarget.style.backgroundColor = '';
                          e.currentTarget.style.color = '';
                        }
                      }}
                    >
                      <item.icon className={`h-4 w-4 ${collapsed ? 'mx-auto' : ''}`} />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          {item.title}
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
