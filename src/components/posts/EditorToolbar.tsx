import { 
  Paperclip, 
  Smile, 
  Camera, 
  Video, 
  Image, 
  BarChart3, 
  Mic,
  Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EditorToolbarProps {
  onAttachFile?: () => void;
  onAddEmoji?: () => void;
  onAddCamera?: () => void;
  onAddVideo?: () => void;
  onAddImage?: () => void;
  onAddPoll?: () => void;
  onAddChart?: () => void;
  onAddAudio?: () => void;
  onAddGif?: () => void;
}

export const EditorToolbar = ({
  onAttachFile,
  onAddEmoji,
  onAddCamera,
  onAddVideo,
  onAddImage,
  onAddPoll,
  onAddChart,
  onAddAudio,
  onAddGif,
}: EditorToolbarProps) => {
  const toolbarItems = [
    { icon: Paperclip, tooltip: 'Anexar arquivo', onClick: onAttachFile },
    { icon: Smile, tooltip: 'Emoji', onClick: onAddEmoji },
    { icon: Camera, tooltip: 'Câmera', onClick: onAddCamera },
    { icon: Video, tooltip: 'Vídeo', onClick: onAddVideo },
    { icon: Type, tooltip: 'GIF', onClick: onAddGif },
    { icon: Image, tooltip: 'Imagem', onClick: onAddImage },
    { icon: BarChart3, tooltip: 'Enquete', onClick: onAddPoll },
    { icon: BarChart3, tooltip: 'Gráfico', onClick: onAddChart },
    { icon: Mic, tooltip: 'Áudio', onClick: onAddAudio },
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-2 border-t border-border bg-muted/30">
        {toolbarItems.map((item, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={item.onClick}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{item.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};