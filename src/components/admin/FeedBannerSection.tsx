import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePageBanner } from '@/hooks/usePageBanner';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponsiveBanner } from '@/components/ui/responsive-banner';
import { BANNER_CONFIG } from '@/constants/banners';

export const FeedBannerSection = () => {
  const { bannerUrl, uploadBanner, removeBanner, isUploading, isRemoving, isLoading } = usePageBanner('feed');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }
    uploadBanner(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Banner do Feed
        </CardTitle>
        <CardDescription>
          Faça upload de um banner que aparecerá no topo da página principal (feed) para todos os usuários da empresa
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full h-[200px] bg-muted animate-pulse rounded-lg" />
        ) : bannerUrl ? (
          <div className="relative w-full overflow-hidden rounded-lg border">
            <ResponsiveBanner
              src={bannerUrl}
              aspectRatio={BANNER_CONFIG.ASPECT_RATIO}
              maxWidth={BANNER_CONFIG.MAX_WIDTH}
              quality={75}
              className="rounded-lg overflow-hidden"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Trocar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => removeBanner()}
                disabled={isRemoving}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        ) : (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors h-[200px] flex flex-col items-center justify-center",
              isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              "hover:border-primary hover:bg-primary/5"
            )}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
          >
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Adicionar Banner do Feed</h3>
            <p className="text-muted-foreground mb-4">
              Arraste uma imagem aqui ou clique para selecionar
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Enviando...' : 'Selecionar Imagem'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {BANNER_CONFIG.RECOMMENDATION_TEXT}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};