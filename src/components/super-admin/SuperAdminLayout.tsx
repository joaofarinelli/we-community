import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSupabaseContext } from "@/hooks/useSupabaseContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  Building2, 
  BarChart3, 
  FileText, 
  Users, 
  Settings,
  ArrowLeft
} from "lucide-react";

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/super-admin"
  },
  {
    key: "companies",
    label: "Empresas",
    icon: Building2,
    path: "/super-admin/companies"
  },
  {
    key: "metrics",
    label: "Métricas",
    icon: BarChart3,
    path: "/super-admin/metrics"
  },
  {
    key: "reports",
    label: "Relatórios",
    icon: FileText,
    path: "/super-admin/reports"
  },
  {
    key: "management",
    label: "Super Admins",
    icon: Users,
    path: "/super-admin/management"
  }
];

export const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize Supabase context for multi-company users
  useSupabaseContext();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Dashboard
              </Button>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-semibold">Administração Global</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link key={item.key} to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="w-full justify-start gap-3"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};