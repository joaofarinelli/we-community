import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Trash2, Upload } from 'lucide-react';
import { useState, useRef } from 'react';
import { usePageBanner, BannerType } from '@/hooks/usePageBanner';
import { ResponsiveBanner } from '@/components/ui/responsive-banner';

interface PageBannerSectionProps {
  bannerType: BannerType;
  title: string;
  description: string;
}

export const PageBannerSection = ({ bannerType, title, description }: PageBannerSectionProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { bannerUrl, uploadBanner, removeBanner, isUploading, isRemoving } = usePageBanner(bannerType);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida');
      return;
    }
    uploadBanner(file);
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {bannerUrl ? (
          <div className="space-y-2">
            <div className="relative w-full rounded-lg overflow-hidden border">
            <ResponsiveBanner
            src={bannerUrl}
            height={400}
            maxWidth={2200}
            quality={75}
            fit="cover"
            focusX={80}
            className="rounded-lg overflow-hidden"
          />
            </div>
            
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? 'Enviando...' : 'Alterar Banner'}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeBanner()}
                disabled={isRemoving}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {isRemoving ? 'Removendo...' : 'Remover'}
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors aspect-[3/1] flex items-center justify-center ${
              dragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-3">
              {isUploading ? (
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              ) : (
                <Upload className="h-12 w-12 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  {isUploading ? 'Enviando...' : 'Clique ou arraste uma imagem'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  PNG, JPG, WEBP (recomendado: 1200x400px)
                </p>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar Arquivo
              </Button>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};