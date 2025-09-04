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

  if (isLoading) return <div className="w-full h-[300px] bg-muted animate-pulse" />;

  const handleFileSelect = (file: File) => { if (file.type.startsWith('image/')) uploadBanner(file); };

  if (bannerUrl) {
    return (
      <div className={`relative w-full ${isAdminMode ? 'border' : ''}`}>
        <ResponsiveBanner
          src={bannerUrl}
          aspectRatio={16/9}
          maxWidth={1536}
          quality={75}
          className="rounded-lg overflow-hidden"
        />
        {isAdmin && isAdminMode && (
          <>
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                <Upload className="h-4 w-4 mr-2" /> Trocar
              </Button>
              <Button size="sm" variant="destructive" onClick={() => removeBanner()} disabled={isRemoving}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} className="hidden" />
          </>
        )}
      </div>
    );
  }

  if (!isAdmin || !isAdminMode) return null;

  return (
    <div
      className={cn(
        "border-2 border-dashed p-8 text-center transition-colors h-[300px] flex flex-col items-center justify-center",
        isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
        "hover:border-primary hover:bg-primary/5"
      )}
      onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const f = Array.from(e.dataTransfer.files)[0]; if (f) handleFileSelect(f); }}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
    >
      <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-semibold mb-2">Adicionar Banner de Cursos</h3>
      <p className="text-muted-foreground mb-4">Arraste uma imagem aqui ou clique para selecionar</p>
      <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} variant="outline">
        <Upload className="h-4 w-4 mr-2" /> {isUploading ? 'Enviando...' : 'Selecionar Imagem'}
      </Button>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => { const f = Array.from(e.target.files || [])[0]; if (f) handleFileSelect(f); }} className="hidden" />
      <p className="text-xs text-muted-foreground mt-2">Formatos: JPG, PNG, WebP (máx. 5MB)</p>
    </div>
  );
};