import { useState } from "react";
import { Home, Users, BookOpen, Calendar, Trophy, Plus, Download, Smartphone } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { useCompany } from "@/hooks/useCompany";

const mainItems = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Courses", url: "/dashboard/courses", icon: BookOpen },
  { title: "Events", url: "/dashboard/events", icon: Calendar },
  { title: "Members", url: "/dashboard/members", icon: Users },
  { title: "Leaderboard", url: "/dashboard/leaderboard", icon: Trophy },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { data: company } = useCompany();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

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
              <div className="animate-fade-in">
                <h2 className="text-lg font-bold font-heading">{company?.name || "Minha Comunidade"}</h2>
                <p className="text-sm text-muted-foreground font-medium">Comunidade Premium</p>
              </div>
            )}
          </div>
        </div>

        {/* First Steps Section */}
        {!collapsed && (
          <SidebarGroup className="px-4 py-4">
            <SidebarGroupLabel className="text-xs font-bold tracking-wider uppercase text-muted-foreground/80 mb-3">
              Primeiros Passos
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-4 px-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">1 de 11 tarefas concluídas</span>
                </div>
                <Progress value={9} className="h-3 bg-muted/50 rounded-full overflow-hidden shadow-soft" />
                <div className="text-xs text-muted-foreground/70 font-medium">
                  9% concluído
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

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
                      end 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                          isActive 
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