import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    section: 'Gestão de Usuários',
    items: [
      { icon: Users, label: 'Gerenciar audiência', path: '/admin/users' },
      { icon: Shield, label: 'Grupos de acesso', path: '/admin/access-groups' },
      { icon: Target, label: 'Segmentos', path: '/admin/segments' },
      { icon: FileText, label: 'Registros em massa', path: '/admin/bulk-records' },
      { icon: Link, label: 'Links de convite', path: '/admin/invite-links' },
      { icon: BookOpen, label: 'Onboarding', path: '/admin/onboarding' },
    ]
  },
  {
    section: 'Customização',
    items: [
      { icon: Tags, label: 'Tags', path: '/admin/tags' },
      { icon: User, label: 'Campos de perfil', path: '/admin/profile-fields' },
      { icon: Trophy, label: 'Gamificação', path: '/admin/gamification' },
      { icon: Activity, label: 'Registros de atividades', path: '/admin/activity-logs' },
    ]
  },
  {
    section: 'Configurações',
    items: [
      { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
      { icon: Settings, label: 'Configurações gerais', path: '/admin/settings' },
      { icon: HelpCircle, label: 'Suporte', path: '/admin/support' },
      { icon: Code, label: 'Desenvolvedores', path: '/admin/developers' },
    ]
  }
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto">
          {menuItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {section.section}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Button
                    key={item.path}
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "w-full justify-start text-left",
                      location.pathname === item.path && "bg-muted text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};