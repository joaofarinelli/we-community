import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
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

  // ✅ Container padrão: largura máxima 1200px, centralizado e mantendo proporção 3:1 (1200x400)
  const wrapperClass = cn(
    'relative w-full max-w-[1200px] mx-auto rounded-lg overflow-hidden',
    'aspect-[3/1]' // 3:1 => 1200x400
  );

  const handleFileSelect = (file: File) => {
    if (!file?.type?.startsWith('image/')) return;
    uploadBanner(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFileSelect(files[0]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleFileSelect(files[0]);
  };

  // ✅ Loading skeleton respeitando a mesma proporção e largura máxima
  if (isLoading) {
    return (
      <div className={cn(wrapperClass, 'bg-muted animate-pulse')} />
    );
  }

  // ✅ Com banner: mantém proporção 3:1, sem cortes
  if (bannerUrl) {
    return (
      <div className={cn(wrapperClass, isAdminMode && 'border')}>
        {/* 
          ✅ ResponsiveBanner agora com proporção 3:1 e "contain" para NÃO cortar (letterbox se necessário).
          Se seu ResponsiveBanner não tiver prop "fit", garanta via className "object-contain".
        */}
        <ResponsiveBanner
          src={bannerUrl}
          aspectRatio={3 / 1}            // ✅ era 16/9
          maxWidth={1200}                // ✅ era 1536
          quality={80}
          fit="contain"                  // ✅ evita cortes; use "cover" se quiser preencher cortando
          className="h-full w-full object-contain bg-muted" // fallback caso não exista prop "fit"
        />

        {isAdmin && isAdminMode && (
          <>
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Enviando...' : 'Trocar'}
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
          </>
        )}
      </div>
    );
  }

  // ✅ Sem banner: se não estiver em modo admin, não mostra nada na página de cursos
  if (!isAdmin || !isAdminMode) {
    return null;
  }

  // ✅ Área de upload para admin, preservando a MESMA proporção 3:1 e largura máx 1200px
  return (
    <div className={wrapperClass}>
      <div
        className={cn(
          'absolute inset-0 border-2 border-dashed p-8 text-center transition-colors',
          'flex flex-col items-center justify-center',
          isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5',
        )}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
        }}
      >
        <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Adicionar Banner de Cursos</h3>
        <p className="text-muted-foreground mb-4">
          Arraste uma imagem aqui ou clique para selecionar
        </p>
        <Button disabled={isUploading} variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Enviando...' : 'Selecionar Imagem'}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Proporção recomendada: <strong>1200×400 (3:1)</strong> — JPG, PNG ou WebP (máx. 5MB)
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    </div>
  );
};