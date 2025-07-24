import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCourseBanner } from '@/hooks/useCourseBanner';
import { useUserRole } from '@/hooks/useUserRole';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CourseBannerSection = () => {
  const { bannerUrl, uploadBanner, removeBanner, isUploading, isRemoving } = useCourseBanner();
  const { data: userRole } = useUserRole();
  const isOwner = userRole?.role === 'owner';
  
  console.log('CourseBannerSection - userRole:', userRole);
  console.log('CourseBannerSection - isOwner:', isOwner);
  console.log('CourseBannerSection - bannerUrl:', bannerUrl);
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

  // If there's a banner, display it
  if (bannerUrl) {
    return (
      <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden mb-6">
        <img
          src={bannerUrl}
          alt="Banner de Cursos"
          className="w-full h-full object-cover"
        />
        {isOwner && (
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
        )}
        {isOwner && (
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

  // If no banner and user is not owner, don't show anything
  if (!isOwner) {
    return null;
  }

  // Show upload area for owners when no banner exists
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
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
      </CardContent>
    </Card>
  );
};