import { X, ExternalLink, Video, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface CircleSidebarProps {
  onClose?: () => void;
}

export function CircleSidebar({ onClose }: CircleSidebarProps) {
  return (
    <aside className="w-[280px] h-screen bg-card border-r border-border/50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <h2 className="text-lg font-semibold">Primeiros Passos</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 hover:bg-muted/70"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Feed */}
        <div>
          <Button
            variant="ghost"
            className="w-full justify-start p-3 h-auto text-left hover:bg-muted/50"
          >
            Feed
          </Button>
        </div>

        <Separator />

        {/* Spaces Section */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Spaces</h3>
          <Button
            variant="ghost"
            className="w-full justify-start p-3 h-auto text-left hover:bg-muted/50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar espaço
          </Button>
        </div>

        <Separator />

        {/* Links Section */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Links</h3>
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-between p-3 h-auto text-left hover:bg-muted/50"
            >
              <span>Baixe o aplicativo Android</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-between p-3 h-auto text-left hover:bg-muted/50"
            >
              <span>Baixe o aplicativo iOS</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start p-3 h-auto text-left hover:bg-muted/50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar link
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border/50 space-y-4">
        <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
          <Video className="h-4 w-4 mr-2" />
          Iniciar Live
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Desenvolvido pela Circle
        </p>
      </div>
    </aside>
  );
}