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
    <Sidebar className={collapsed ? "w-16" : "w-72"} collapsible="icon">
      <SidebarContent className="glass border-r border-border/20 backdrop-blur-xl">
        {/* Company Header */}
        <div className="p-6 border-b border-border/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-elegant hover:shadow-glow transition-all duration-300 animate-float">
              <Users className="h-6 w-6 text-white" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in flex-1">
                <CompanyLogo 
                  fallbackText="Minha Comunidade"
                  textClassName="text-lg font-bold font-heading"
                  logoClassName="h-8 w-auto object-contain max-w-[120px]"
                />
                <p className="text-sm text-muted-foreground font-medium">Comunidade Premium</p>
              </div>
            )}
          </div>
        </div>


        {/* Main Navigation */}
        <SidebarGroup className="px-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {mainItems.map((item, index) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className="rounded-xl transition-all duration-200 hover:shadow-soft"
                  >
                     <NavLink 
                      to={item.url} 
                      end={item.url === "/dashboard"}
                      onClick={() => handleNavClick(item.url)}
                      className={({ isActive: navLinkIsActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                          isActive(item.url)
                            ? "bg-primary text-primary-foreground shadow-elegant scale-[1.02]" 
                            : "hover:bg-muted/50 hover:translate-x-1"
                        }`
                      }
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <item.icon className={`h-5 w-5 ${isActive(item.url) ? "animate-float" : ""}`} />
                      {!collapsed && (
                        <span className="animate-fade-in font-semibold">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Spaces Section */}
        {!collapsed && (
          <SidebarGroup className="px-4 mt-6">
            <SidebarGroupLabel className="text-xs font-bold tracking-wider uppercase text-muted-foreground/80 mb-3">
              Spaces
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton className="rounded-xl hover:shadow-soft transition-all duration-200 hover:bg-muted/50 px-3 py-2.5">
                    <Plus className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-primary">Criar espaço</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* App Links Section */}
        {!collapsed && (
          <SidebarGroup className="px-4 mt-6">
            <SidebarGroupLabel className="text-xs font-bold tracking-wider uppercase text-muted-foreground/80 mb-3">
              Links
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton className="rounded-xl hover:shadow-soft transition-all duration-200 hover:bg-muted/50 px-3 py-2.5 group">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition-colors">
                        <Smartphone className="h-4 w-4 text-accent" />
                      </div>
                      <span className="font-semibold text-accent">Download App</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}