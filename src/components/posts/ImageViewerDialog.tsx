import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ImageViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  alt?: string;
}

export const ImageViewerDialog = ({
  open,
  onOpenChange,
  imageUrl,
  alt = 'Imagem'
}: ImageViewerDialogProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      // Fetch the image
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Erro ao baixar imagem');
      
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from URL or use default
      const urlParts = imageUrl.split('/');
      const filename = urlParts[urlParts.length - 1] || 'imagem.jpg';
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download concluído",
        description: "A imagem foi baixada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a imagem.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black/95 border-none">
        {/* Header com botões de ação */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="bg-black/50 text-white hover:bg-black/70 border-white/20"
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? 'Baixando...' : 'Baixar'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="bg-black/50 text-white hover:bg-black/70 border-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Imagem centralizada */}
        <div className="flex items-center justify-center w-full h-full min-h-[50vh] p-8">
          <img
            src={imageUrl}
            alt={alt}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            style={{ maxHeight: '90vh', maxWidth: '90vw' }}
          />
        </div>

        {/* Overlay clicável para fechar */}
        <div 
          className="absolute inset-0 -z-10 cursor-pointer"
          onClick={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};