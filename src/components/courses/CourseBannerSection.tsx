import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCourseBanner } from '@/hooks/useCourseBanner';
import { useIsAdmin } from '@/hooks/useUserRole';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponsiveBanner } from '@/components/ui/responsive-banner';

interface CourseBannerSectionProps {
  isAdminMode?: boolean;
}

export const CourseBannerSection = ({ isAdminMode = false }: CourseBannerSectionProps) => {
  const { bannerUrl, uploadBanner, removeBanner, isUploading, isRemoving, isLoading } = useCourseBanner();
  const isAdmin = useIsAdmin();
  
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bannerHeight = isAdminMode ? "h-[200px]" : "h-[300px]";

  if (isLoading) {
    return (
      <div className={`w-full ${bannerHeight} bg-muted animate-pulse`} />
    );
  }

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

  // If there's a banner, display it (always show if banner exists, regardless of role)
  if (bannerUrl) {
    return (
      <div className={`relative w-full ${isAdminMode ? 'border' : ''}`}>
        <ResponsiveBanner
          src={bannerUrl}
          aspectRatio={1200/400}
          maxHeight={400}
          maxWidth={1200}
          quality={75}
          className={isAdminMode ? "overflow-hidden"}
        />
        {isAdmin && isAdminMode && (
          <div className="absolute top-4 right-4 flex gap-2 z-10">
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
        )}
        {isAdmin && isAdminMode && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        )}
      </div>
    );
  }

  // If no banner and user is not admin or not admin mode, show message or nothing
  if (!isAdmin || !isAdminMode) {
    if (!isAdminMode) {
      // In courses page, don't show anything if no banner
      return null;
    }
    return (
      <div className={`w-full ${bannerHeight} border border-dashed border-muted-foreground/25 flex items-center justify-center`}>
        <p className="text-muted-foreground">Nenhum banner configurado</p>
      </div>
    );
  }

  // Show upload area for admins in admin mode when no banner exists
  return (
    <div
      className={cn(
        `border-2 border-dashed p-8 text-center transition-colors ${bannerHeight} flex flex-col items-center justify-center`,
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
      <h3 className="text-lg font-semibold mb-2">Adicionar Banner de Cursos</h3>
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
        Formatos aceitos: JPG, PNG, WebP (máx. 5MB)
      </p>
    </div>
  );
};