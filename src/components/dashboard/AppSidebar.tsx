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
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-background border-r">
        {/* Company Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="text-sm font-semibold">{company?.name || "Minha Comunidade"}</h2>
                <p className="text-xs text-muted-foreground">Comunidade</p>
              </div>
            )}
          </div>
        </div>

        {/* First Steps Section */}
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>Primeiros Passos</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-3 py-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">1 de 11 tarefas concluídas</span>
                </div>
                <Progress value={9} className="h-2" />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Spaces Section */}
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>Spaces</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Plus className="h-4 w-4" />
                    <span>Criar espaço</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* App Links Section */}
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>Links</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Smartphone className="h-4 w-4" />
                    <span>Download App</span>
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