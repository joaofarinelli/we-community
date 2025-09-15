
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
  const { data: company } = useCompany();
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
    <Sidebar className={collapsed ? "w-16" : "w-64"}>
      <SidebarContent className="bg-card border-r border-border">
        {/* Company Header */}
        {!collapsed && (
          <div className="p-4 border-b border-border h-[72px] flex items-center">
            <CompanyLogo 
              fallbackText="Minha Empresa"
              textClassName="text-lg font-semibold text-foreground"
              logoClassName="h-8 w-auto object-contain max-w-[150px]"
            />
          </div>
        )}

        {/* Main Navigation */}
        <SidebarGroup className="p-2">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                     <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      onClick={() => handleNavClick(item.url)}
                      className="flex items-center gap-3 px-4 py-3 rounded-md font-medium transition-colors text-foreground"
                      style={({ isActive: navIsActive }) => {
                        const active = isActive(item.url);
                        if (active) {
                          return {
                            backgroundColor: company?.primary_color,
                            color: company?.button_text_color ?? "#fff",
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
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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
