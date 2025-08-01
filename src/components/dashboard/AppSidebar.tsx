import { Rss, Grid3X3, Map, Users, Trophy, BookOpen, ShoppingBag, Store, Wallet, Target, Plus, Smartphone } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { useCompany } from "@/hooks/useCompany";
import { CompanyLogo } from "@/components/ui/company-logo";
import { useIsFeatureEnabled } from "@/hooks/useCompanyFeatures";

interface AppSidebarProps {
  onClose?: () => void;
}

export function AppSidebar({ onClose }: AppSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { data: company } = useCompany();
  const collapsed = state === "collapsed";
  
  // Feature flags
  const isRankingEnabled = useIsFeatureEnabled('ranking');
  const isMarketplaceEnabled = useIsFeatureEnabled('marketplace');
  const isStoreEnabled = useIsFeatureEnabled('store');
  const isBankEnabled = useIsFeatureEnabled('bank');
  const isChallengesEnabled = useIsFeatureEnabled('challenges');
  
  // Dynamic main items based on enabled features (matching CircleSidebar)
  const mainItems = [
    { title: "Feed", url: "/dashboard", icon: Rss },
    { title: "Espaços", url: "/dashboard/spaces", icon: Grid3X3 },
    { title: "Trilhas", url: "/dashboard/trails", icon: Map },
    { title: "Membros", url: "/dashboard/members", icon: Users },
    ...(isRankingEnabled ? [{ title: "Ranking", url: "/dashboard/ranking", icon: Trophy }] : []),
    { title: "Cursos", url: "/courses", icon: BookOpen },
    ...(isMarketplaceEnabled ? [{ title: "Marketplace", url: "/dashboard/marketplace", icon: ShoppingBag }] : []),
    ...(isStoreEnabled ? [{ title: "Loja", url: "/dashboard/store", icon: Store }] : []),
    ...(isBankEnabled ? [{ title: "Banco", url: "/dashboard/bank", icon: Wallet }] : []),
    ...(isChallengesEnabled ? [{ title: "Desafios", url: "/dashboard/challenges", icon: Target }] : []),
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === "/dashboard";
    }
    if (path === "/courses") {
      return currentPath.startsWith("/courses");
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
          <div className="p-4 border-b border-border">
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
                      className={({ isActive: navLinkIsActive }) => 
                        `flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                          isActive(item.url)
                            ? "bg-primary text-primary-foreground" 
                            : "text-foreground hover:bg-muted"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && (
                        <span>{item.title}</span>
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